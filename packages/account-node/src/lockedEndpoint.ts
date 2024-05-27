import AutoAccount from './auto'
import { Keyring } from '@verida/keyring'
import { VeridaDatabaseAuthTypeConfig, AuthContext, AuthTypeConfig, AccountConfig, AccountNodeConfig, SecureContextConfig, VeridaDatabaseAuthContext, LockedEndpointAccountConfig } from '@verida/types'

/**
 * An Account object that is locked to a specific endpoint with supplied
 * access token.
 */
export default class LockedEndpointAccount extends AutoAccount {

    private accountDid: string
    private contextCache: any = {}

    constructor(autoConfig: AccountNodeConfig, contextConfig: LockedEndpointAccountConfig, accountConfig?: AccountConfig) {
        super(autoConfig, accountConfig)
        this.contextCache[contextConfig.contextName] = contextConfig
        this.accountDid = contextConfig.did

        this.addContext(contextConfig.contextName, contextConfig.contextConfig, new Keyring(contextConfig.signature), contextConfig.contextAuths)
    }

    public setAccountConfig(accountConfig: AccountConfig) {
        throw new Error("Not implemented")
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
            throw new Error(`Locked endpoitn account can't force creation of a new storage context`)
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
        throw new Error("Disconnect is not supported.")
    }

    // Handle scenario where the Endpoint hostname doesn't exactly match the DID
    // Document endpoint (typically when port 443 is in one endpoint, but not the other
    private locateEndpointContextAuth(contextName: string, endpointUri: string): VeridaDatabaseAuthContext | undefined {
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
            throw new Error("Context not supported")
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

                contextAuth.refreshToken = undefined
                return contextAuth
            }

            throw new Error(`Unknown service endpoint type (${serviceEndpoint.type})`)
        }

        throw new Error(`Unknown auth context type (${authType})`)
    }

}