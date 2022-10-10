import { Account, VeridaDatabaseAuthContext, AuthTypeConfig, AuthContext, VeridaDatabaseAuthTypeConfig, ContextAuthorizationError } from '@verida/account'
import { Interfaces } from '@verida/storage-link'
import { Keyring } from '@verida/keyring'
import VaultModalLogin from './vault-modal-login'
import Axios from "axios";
const jwt = require('jsonwebtoken');

const querystring = require('querystring')
const _ = require('lodash')
const store = require('store')
const VERIDA_AUTH_CONTEXT = '_verida_auth_context'
const VERIDA_AUTH_TOKEN_QUERY_KEY = '_verida_auth'

import { VaultAccountConfig } from "./interfaces"

const CONFIG_DEFAULTS = {
    loginUri: 'https://vault.verida.io/request',
    serverUri: 'wss://auth-server.testnet.verida.io:7002',
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
export default class VaultAccount extends Account {
    private config: VaultAccountConfig

    private accountDid?: string
    private contextCache: any = {}

    constructor(config: VaultAccountConfig = {}) {
        super()
        this.config = config
        this.config.request = this.config.request ? this.config.request : {}
        this.config.request.userAgent = navigator.userAgent
    }

    public async connectContext(contextName: string, ignoreSession: boolean = false) {
        const vaultAccount = this

        if (!ignoreSession) {
            const contextConfig = await this.loadFromSession(contextName)
            if (contextConfig) {
                return contextConfig
            }
        }

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
                vaultAccount.addContext(response.context, response.contextConfig, new Keyring(response.signature), response.contextAuth)
                resolve(true)
            }

            const config: VaultAccountConfig = _.merge(CONFIG_DEFAULTS, this.config, {
                callback: cb,
                callbackRejected: function() {
                    resolve(false)
                }
            })

            VaultModalLogin(contextName, config)
        })

        return promise
    }

    /**
     * Verify we have valid JWT's and non-expired accessToken and refreshToken
     * 
     * @param contextAuth 
     * @returns 
     */
    public contextAuthIsValid(contextAuth: VeridaDatabaseAuthContext): boolean {
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
        if (decodedAccessToken.exp < now || decodedRefreshToken.exp < now) {
            return false
        }

        return true
    }

    public async loadFromSession(contextName: string): Promise<Interfaces.SecureContextConfig | undefined> {
        // First, attempt to Load from query parameters if specified
        const token = getAuthTokenFromQueryParams()
        if (token && token.context == contextName) {
            if (this.contextAuthIsValid(token.contextAuth)) {
                this.addContext(token.context, token.contextConfig, new Keyring(token.signature), token.contextAuth)
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

        if (this.contextAuthIsValid(response.contextAuth)) {
            this.setDid(response.did)

            this.addContext(response.context, response.contextConfig, new Keyring(response.signature), response.contextAuth)

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

    public addContext(contextName: string, contextConfig: Interfaces.SecureContextConfig, keyring: Keyring, contextAuth: VeridaDatabaseAuthContext) {
        this.contextCache[contextName] = {
            keyring,
            contextConfig,
            contextAuth
        }
    }

    public async storageConfig(contextName: string, forceCreate: boolean = false): Promise<Interfaces.SecureContextConfig | undefined> {
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
     public async linkStorage(storageConfig: Interfaces.SecureContextConfig): Promise<void> {
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

    public async getAuthContext(contextName: string, contextConfig: Interfaces.SecureContextConfig, authConfig: AuthTypeConfig = {
        force: false
    }, authType: string = "database"): Promise<AuthContext> {
        if (authConfig.force || !this.contextCache[contextName]) {
            // Don't have an existing context in the cache or we need to force refresh
            await this.connectContext(contextName, true)
        }

        const serviceEndpoint = contextConfig.services.databaseServer
        if (serviceEndpoint.type == "VeridaDatabase") {
            // If we have an invalid access token (detected by the internal libraries)
            // then attempt to re-authenticate using the refreshToken
            if ((<VeridaDatabaseAuthTypeConfig> authConfig).invalidAccessToken) {
                const did = await this.did()

                try {
                    const accessResponse = await this.getAxios(contextName).post(serviceEndpoint.endpointUri + "auth/connect",{
                        refreshToken: this.contextCache[contextName].contextAuth.refreshToken,
                        did,
                        contextName: contextName
                    });
            
                    const accessToken = accessResponse.data.accessToken
                    this.contextCache[contextName].contextAuth.accessToken = accessToken
                    return this.contextCache[contextName].contextAuth
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
        }

        if (this.contextCache[contextName] && this.contextCache[contextName].contextAuth) {
            return this.contextCache[contextName].contextAuth
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