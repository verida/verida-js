import { Keyring } from '@verida/keyring'
import { Account } from '@verida/account'
import { AccountConfig, AuthContext, AuthTypeConfig, ContextAuthorizationError, SecureContextConfig, SessionAccountConfig, VeridaDatabaseAuthContext, VeridaDatabaseAuthTypeConfig } from '@verida/types'
import Axios from 'axios'

export class SessionAccount extends Account {
    private accountConfig?: AccountConfig
    private sessionConfig: SessionAccountConfig

    constructor(sessionConfig: SessionAccountConfig, accountConfig?: AccountConfig) {
        super()
        this.sessionConfig = sessionConfig
        this.accountConfig = accountConfig
    }

    public setAccountConfig(accountConfig: AccountConfig) {
        this.accountConfig = accountConfig
    }

    public getAccountConfig(): AccountConfig | undefined {
        return this.accountConfig
    }

    public getSessionConfig(): SessionAccountConfig {
        return this.sessionConfig
    }

    public async keyring(contextName: string): Promise<Keyring> {
        if (this.sessionConfig.session.contextName !== contextName) {
            throw new Error(`Account does not support context: ${contextName}`)
        }

        return new Keyring(this.sessionConfig.session.signature)
    }

    // returns a compact JWS
    public async sign(message: string): Promise<string> {
        throw new Error("Not implemented. Use `keyring()` instead.")
    }

    public async did(): Promise<string> {
        return this.sessionConfig.session.did
    }

    public async storageConfig(contextName: string, forceCreate?: boolean): Promise<SecureContextConfig | undefined> {
        if (this.sessionConfig.session.contextName !== contextName) {
          throw new Error(`Account does not support context: ${contextName}`)
        }

        return this.sessionConfig.session.contextConfig
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

    // Handle scenario where the Endpoint hostname doesn't exactly match the DID
    // Document endpoint (typically when port 443 is in one endpoint, but not the other
    private locateEndpointContextAuth(contextName: string, endpointUri: string): VeridaDatabaseAuthContext | undefined {
        if (this.sessionConfig.session.contextName !== contextName) {
            throw new Error(`Account does not support context: ${contextName}`)
        }

        const endpointHostname = new URL(endpointUri)

        const filteredContextAuths = Object.entries(this.sessionConfig.session.contextAuths).filter(([uri]) => {
            const url = new URL(uri)
            return endpointHostname.hostname === url.hostname
        }).map(([, contextAuth]) => contextAuth)

        if (filteredContextAuths.length === 0) {
            return undefined
        }

        return filteredContextAuths[0]
    }

    public async getAuthContext(contextName: string, contextConfig: SecureContextConfig, authConfig: AuthTypeConfig = {
        force: false
    }, authType: string = "database"): Promise<AuthContext> {
        if (this.sessionConfig.session.contextName !== contextName) {
            throw new Error(`Account does not support context: ${contextName}`)
        }

        // @todo: Currently hard code database, need to support other types in the future
        if (authType !== 'database') {
          throw new Error(`Unknown auth context type (${authType})`)
        }

        const serviceEndpoint = contextConfig.services.databaseServer

        // @todo: Currently hard code database server, need to support other service types in the future
        if (serviceEndpoint.type !== "VeridaDatabase") {
            throw new Error(`Unknown service endpoint type (${serviceEndpoint.type})`)
        }

        // FIXME: This is very dangerous to assert this way.
        // Taken from vault-account.ts, to fix there as well
        const veridaDatabaseConfig = <VeridaDatabaseAuthTypeConfig> authConfig

        if (!veridaDatabaseConfig.endpointUri) {
            throw new Error('Endpoint must be specified when getting auth context')
        }

        const contextAuth = this.locateEndpointContextAuth(contextName, veridaDatabaseConfig.endpointUri)

        if (!contextAuth) {
            throw new Error('Endpoint not known for this authentication context')
        }

        const endpointUri = contextAuth.endpointUri as string

        // Attempt to re-authenticate using the refreshToken
        const did = await this.did()

        try {
            const accessResponse = await this.getAxios(contextName).post(endpointUri + "auth/connect", {
                refreshToken: contextAuth.refreshToken,
                did,
                contextName: contextName
            });

            const accessToken = accessResponse.data.accessToken
            contextAuth.accessToken = accessToken

            return contextAuth
        } catch (error: unknown) {
            // Refresh token is invalid, so raise an exception that will be caught within the protocol
            if (error instanceof Error && error.message === 'Request failed with status code 401') {
                throw new ContextAuthorizationError("Expired refresh token")
            }

            throw error
        }
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
