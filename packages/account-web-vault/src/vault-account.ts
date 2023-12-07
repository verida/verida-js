import { Keyring } from '@verida/keyring'
import VaultModalLogin from './vault-modal-login'
import Axios from "axios";
import { Account } from '@verida/account';
import { EnvironmentType, AccountVaultConfig, AccountConfig, VeridaDatabaseAuthContext, SecureContextConfig, AuthTypeConfig, AuthContext, VeridaDatabaseAuthTypeConfig, ContextAuthorizationError} from '@verida/types';

const jwt = require('jsonwebtoken');
const querystring = require('querystring')
const _ = require('lodash')
const store = require('store')
const VERIDA_AUTH_CONTEXT = '_verida_auth_context'
const VERIDA_AUTH_TOKEN_QUERY_KEY = '_verida_auth'

const CONFIG_DEFAULTS: Record<EnvironmentType, AccountVaultConfig> = {
    devnet: {
        loginUri: 'https://vault.verida.io/request',
        serverUri: `wss://auth.testnet.verida.io`
    },
    local: {
        loginUri: 'https://vault.verida.io/request',
        serverUri: `wss://auth.testnet.verida.io`
    },
    mainnet: {
        loginUri: 'https://vault.verida.io/request',
        serverUri: `wss://auth.testnet.verida.io`
    },
    testnet: {
        loginUri: 'https://vault.verida.io/request',
        serverUri: `wss://auth.testnet.verida.io`
    }
}

/**
 * Get an auth token from query params
 * 
 * @returns 
 */
const getAuthTokenFromQueryParams = () => {
    // Attempt to load session from query params
    const params = querystring.parse(window.location.search.substring(1,))
    if (typeof(params[VERIDA_AUTH_TOKEN_QUERY_KEY]) != 'undefined') {
        const encodedToken = params[VERIDA_AUTH_TOKEN_QUERY_KEY]
        const jsonToken = Buffer.from(encodedToken, 'base64').toString('utf8')
        try {
            const token = JSON.parse(jsonToken)
            return token
        } catch (err) {
            // Invalid token, unable to parse
            console.warn("Invalid auth token in query params")
            return
        }
    }

    return false
}

export const hasSession = (contextName: string): boolean => {
    // Check if an auth token is in the query params
    // If so, it will be correctly loaded later
    const token = getAuthTokenFromQueryParams()
    if (token && token.context == contextName) {
        return true
    }

    // Attempt to load session from local storage
    const storedSessions = store.get(VERIDA_AUTH_CONTEXT)

    if (!storedSessions || !storedSessions[contextName]) {
        return false
    } else {
        return true
    }
}

/**
 * An Authenticator that requests for authorization from the Vault
 */
export class VaultAccount extends Account {
    private config: AccountVaultConfig

    private accountDid?: string
    private contextCache: any = {}

    constructor(config: AccountVaultConfig = {}) {
        super()
        this.config = config
        this.config.request = this.config.request ? this.config.request : {}
        this.config.request.userAgent = navigator.userAgent

        if (!this.config.environment) {
            this.config.environment = EnvironmentType.MAINNET
        }

        this.config = _.merge(CONFIG_DEFAULTS[this.config.environment], this.config)
    }

    public async connectContext(contextName: string, ignoreSession: boolean = false) {
        const vaultAccount = this

        if (!ignoreSession) {
            const contextConfig = await this.loadFromSession(contextName)
            if (contextConfig) {
                return contextConfig
            }
        }

        const CONFIG = CONFIG_DEFAULTS[this.config.environment!]

        const promise = new Promise<boolean>((resolve, reject) => {
            const cb = async (response: any, saveSession: boolean) => {
                if (saveSession) {
                    let storedSessions = store.get(VERIDA_AUTH_CONTEXT)
                    if (!storedSessions) {
                        storedSessions = {}
                    }
 
                    storedSessions[contextName] = response
                    store.set(VERIDA_AUTH_CONTEXT, storedSessions)
                }

                this.setDid(response.did)
                vaultAccount.addContext(response.context, response.contextConfig, new Keyring(response.signature), response.contextAuths)
                resolve(true)
            }

            const config: AccountVaultConfig = _.merge(CONFIG, this.config, {
                callback: cb,
                callbackRejected: function() {
                    resolve(false)
                }
            })

            VaultModalLogin(contextName, config)
        })

        return promise
    }

    public setAccountConfig(accountConfig: AccountConfig) {
        throw new Error("Not implemented")
    }

    /**
     * Verify we have valid JWT's and non-expired accessToken and refreshToken
     * 
     * @param contextAuth 
     * @returns 
     */
    public contextAuthIsValid(contextAuths: VeridaDatabaseAuthContext[]): boolean {
        for (let c in contextAuths) {
            const contextAuth = contextAuths[c]

            if (!contextAuth.accessToken || !contextAuth.refreshToken) {
                return false
            }

            // verify tokens are valid JWT's
            const decodedAccessToken = jwt.decode(contextAuth.accessToken!)
            if (!decodedAccessToken) {
                return false
            }

            const decodedRefreshToken = jwt.decode(contextAuth.refreshToken!)
            if (!decodedRefreshToken) {
                return false
            }

            // verify tokens haven't expired
            const now = Math.floor(Date.now() / 1000)
            if (decodedRefreshToken.exp < now) {
                return false
            }
        }

        return true
    }

    public async loadFromSession(contextName: string): Promise<SecureContextConfig | undefined> {
        // First, attempt to Load from query parameters if specified
        const token = getAuthTokenFromQueryParams()
        if (token && token.context == contextName) {
            // convert a single context auth to an array
            if (token.contextAuth && !token.contextAuths) {
                token.contextAuths = [token.contextAuth]
            }

            if (this.contextAuthIsValid(token.contextAuths)) {
                this.addContext(token.context, token.contextConfig, new Keyring(token.signature), token.contextAuths)
                this.setDid(token.did)

                if (typeof(this.config!.callback) === "function") {
                    this.config!.callback(token)
                }

                // Store the session from the query params so future page loads will be authenticated
                let storedSessions = store.get(VERIDA_AUTH_CONTEXT)
                if (!storedSessions) {
                    storedSessions = {}
                }

                storedSessions[contextName] = token
                store.set(VERIDA_AUTH_CONTEXT, storedSessions)
                
                return token.contextConfig
            }
        }

        const storedSessions = store.get(VERIDA_AUTH_CONTEXT)

        if (!storedSessions || !storedSessions[contextName]) {
            return
        }

        const response = storedSessions[contextName]

        if (this.contextAuthIsValid(response.contextAuths)) {
            this.setDid(response.did)

            this.addContext(response.context, response.contextConfig, new Keyring(response.signature), response.contextAuths)

            if (typeof(this.config!.callback) === "function") {
                this.config!.callback(response)
            }

            return response.contextConfig
        }
    }

    public async keyring(contextName: string): Promise<Keyring> {
        if (typeof(this.contextCache[contextName]) == 'undefined') {
            throw new Error(`Unable to connect to requested context: ${contextName}`)
        }

        return this.contextCache[contextName].keyring
    }

    public addContext(contextName: string, contextConfig: SecureContextConfig, keyring: Keyring, contextAuths: VeridaDatabaseAuthContext[]) {
        this.contextCache[contextName] = {
            keyring,
            contextConfig,
            contextAuths
        }
    }

    public async storageConfig(contextName: string, forceCreate: boolean = false): Promise<SecureContextConfig | undefined> {
        if (this.contextCache[contextName]) {
            return this.contextCache[contextName].contextConfig
        }

        if (forceCreate) {
            await this.connectContext(contextName)

            if (this.contextCache[contextName]) {
                return this.contextCache[contextName].contextConfig
            }
        }
    }

    public async sign(message: string): Promise<string> {
        throw new Error("Not implemented. Use `keyring()` instead.")
    }

    public async did(): Promise<string> {
        return this.accountDid!
    }

    public setDid(did: string) {
        this.accountDid = did
    }

    /**
     * Link storage to this user
     *
     * @param storageConfig
     */
     public async linkStorage(storageConfig: SecureContextConfig): Promise<boolean> {
        throw new Error("Link storage is not supported. Vault needs to have already created the storage.")
     }

     /**
      * Unlink storage for this user
      *
      * @param contextName
      */
    public async unlinkStorage(contextName: string): Promise<boolean> {
        throw new Error("Unlink storage is not supported. Request via the Vault.")
    }

    public async disconnect(contextName?: string): Promise<void> {
        // @todo, support logging out just one
        store.remove(VERIDA_AUTH_CONTEXT)
    }

    // Handle scenario where the Endpoint hostname doesn't exactly match the DID
    // Document endpoint (typically when port 443 is in one endpoint, but not the other
    private locateEndpointContextAuth(contextName: string, endpointUri: string): any {
        const endpointHostname = new URL(endpointUri)
        let contextAuth
        Object.keys(this.contextCache[contextName].contextAuths).forEach(uri => {
            const url = new URL(uri)

            if (endpointHostname.hostname === url.hostname) {
                contextAuth = this.contextCache[contextName].contextAuths[uri]
            }
        });

        return contextAuth
    }

    public async getAuthContext(contextName: string, contextConfig: SecureContextConfig, authConfig: AuthTypeConfig = {
        force: false
    }, authType: string = "database"): Promise<AuthContext> {
        if (authConfig.force || !this.contextCache[contextName]) {
            // Don't have an existing context in the cache or we need to force refresh
            await this.connectContext(contextName, true)
        }

        if (authType == 'database') {
            const serviceEndpoint = contextConfig.services.databaseServer
            if (serviceEndpoint.type == "VeridaDatabase") {
                const veridaDatabaseConfig = <VeridaDatabaseAuthTypeConfig> authConfig

                if (typeof(veridaDatabaseConfig.endpointUri) == 'undefined') {
                    throw new Error('Endpoint must be specified when getting auth context')
                }

                const contextAuth = this.locateEndpointContextAuth(contextName, veridaDatabaseConfig.endpointUri)
                if (!contextAuth) {
                    throw new Error('Endpoint not known for this authentication context')
                }

                const endpointUri = contextAuth.endpointUri

                // Attempt to re-authenticate using the refreshToken
                const did = await this.did()

                try {
                    const accessResponse = await this.getAxios(contextName).post(endpointUri + "auth/connect", {
                        refreshToken: this.contextCache[contextName].contextAuths[endpointUri].refreshToken,
                        did,
                        contextName: contextName
                    });
            
                    const accessToken = accessResponse.data.accessToken
                    this.contextCache[contextName].contextAuths[endpointUri].accessToken = accessToken
                    return this.contextCache[contextName].contextAuths[endpointUri]
                } catch (err: any) {
                    // Refresh token is invalid, so raise an exception that will be caught within the protocol
                    // and force the sign in to be restarted
                    if (err.message == 'Request failed with status code 401') {
                        throw new ContextAuthorizationError("Expired refresh token")
                    } else {
                        throw err
                    }
                }
            }

            throw new Error(`Unknown service endpoint type (${serviceEndpoint.type})`)
        }

        throw new Error(`Unknown auth context type (${authType})`)
    }

    private getAxios(storageContext: string, accessToken?: string) {
        let config: any = {
            headers: {
            // @todo: Application-Name needs to become Storage-Context
            "Application-Name": storageContext,
            },
        };

        if (accessToken) {
            config.headers['Authorization'] = `Bearer ${accessToken}`
        }

        return Axios.create(config);
    }
}