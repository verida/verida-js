import { Interfaces, StorageLink, DIDStorageConfig } from '@verida/storage-link'
import { Keyring } from '@verida/keyring'
import { Account, AccountConfig, AuthContext, AuthTypeConfig } from '@verida/account'
import { NodeAccountConfig } from './interfaces'

import { DIDClient, Wallet } from '@verida/did-client'
import EncryptionUtils from "@verida/encryption-utils"
import { Interfaces as DIDDocumentInterfaces } from "@verida/did-document"
import VeridaDatabaseAuthType from "./authTypes/VeridaDatabase"
import { ServiceEndpoint } from 'did-resolver'

/**
 * An Authenticator that automatically signs everything
 */
export default class AutoAccount extends Account {

    private didClient: DIDClient

    private wallet: Wallet
    protected accountConfig: AccountConfig
    protected autoConfig: NodeAccountConfig
    protected contextAuths: Record<string, Record<string, VeridaDatabaseAuthType>> = {}

    constructor(accountConfig: AccountConfig, autoConfig: NodeAccountConfig) {
        super()
        this.accountConfig = accountConfig
        this.autoConfig = autoConfig
        this.wallet = new Wallet(autoConfig.privateKey, <string> autoConfig.environment)

        this.didClient = new DIDClient({
            ...autoConfig.didClientConfig,
            network: <'testnet' | 'mainnet'> autoConfig.environment
        })
    }

    public async keyring(contextName: string): Promise<Keyring> {
        let did = await this.did()
        did = did.toLowerCase()
        const consentMessage = `Do you wish to unlock this storage context: "${contextName}"?\n\n${did}`
        const signature = await this.sign(consentMessage)
        return new Keyring(signature)
    }

    // returns a compact JWS
    public async sign(message: string): Promise<string> {
        return EncryptionUtils.signData(message, this.wallet.privateKeyBuffer)
    }

    public async did(): Promise<string> {
        return this.wallet.did
    }

    public async storageConfig(contextName: string, forceCreate?: boolean): Promise<Interfaces.SecureContextConfig | undefined> {
        this.ensureAuthenticated()

        const did = await this.did()
        let storageConfig = await StorageLink.getLink(this.didClient, did, contextName, true)
        
        // Create the storage config if it doesn't exist and force create is specified
        if (!storageConfig && forceCreate) {
            const endpoints: Interfaces.SecureContextServices = {
                databaseServer: this.accountConfig.defaultDatabaseServer,
                messageServer: this.accountConfig.defaultMessageServer
            }

            if (this.accountConfig.defaultStorageServer) {
                endpoints.storageServer = this.accountConfig.defaultStorageServer
            }

            if (this.accountConfig.defaultNotificationServer) {
                endpoints.notificationServer = this.accountConfig.defaultNotificationServer
            }

            storageConfig = await DIDStorageConfig.generate(this, contextName, endpoints)
            await this.linkStorage(storageConfig)
        }

        return storageConfig
    }

    /**
     * Link storage to this user
     * 
     * @param storageConfig 
     */
     public async linkStorage(storageConfig: Interfaces.SecureContextConfig): Promise<void> {
        this.ensureAuthenticated()
        const keyring = await this.keyring(storageConfig.id)
        await StorageLink.setLink(this.didClient, storageConfig, keyring, this.wallet.privateKey)
     }

     /**
      * Unlink storage for this user
      * 
      * @param contextName 
      */
    public async unlinkStorage(contextName: string): Promise<boolean> {
        this.ensureAuthenticated()
        return await StorageLink.unlink(this.didClient, contextName)
    }

    /**
     * Link storage context service endpoint
     * 
     */
    public async linkStorageContextService(contextName: string, endpointType: DIDDocumentInterfaces.EndpointType, serverType: string, endpointUris: string[]) {
        this.ensureAuthenticated()
        return await StorageLink.setContextService(this.didClient, contextName, endpointType, serverType, endpointUris)
    }

    public getDidClient() {
        this.ensureAuthenticated()
        return this.didClient
    }

    public async getAuthContext(contextName: string, contextConfig: Interfaces.SecureContextConfig, endpointUri: ServiceEndpoint, authConfig: AuthTypeConfig = {
        force: false
    }, authType: string = "database"): Promise<AuthContext> {
        endpointUri = <string> endpointUri

        // Use existing context auth instance if it exists
        if (this.contextAuths[contextName] && this.contextAuths[contextName][endpointUri]  && !authConfig.force) {
            return this.contextAuths[contextName][endpointUri].getAuthContext()
        }

        const signKey = contextConfig.publicKeys.signKey
        
        // @todo: Currently hard code database server, need to support other service types in the future
        const serviceEndpoint = contextConfig.services.databaseServer

        if (serviceEndpoint.type == "VeridaDatabase") {
            if (!this.contextAuths[contextName]) {
                this.contextAuths[contextName] = {}
            }

            const authType = new VeridaDatabaseAuthType(this, contextName, endpointUri, signKey)
            this.contextAuths[contextName][endpointUri] = authType

            return authType.getAuthContext(authConfig)
        }

        throw new Error(`Unknown auth context type (${authType})`)
    }

    public async disconnectDevice(contextName: string, deviceId: string="Test device"): Promise<boolean> {
        if (!this.contextAuths[contextName]) {
            throw new Error(`Context not connected ${contextName}`)
        }

        let success = true
        const contextAuths = this.contextAuths[contextName]
        for (let i in contextAuths) {
            if (!(await contextAuths[i].disconnectDevice(deviceId))) {
                success = false
            }
        }

        return success
    }

    private ensureAuthenticated() {
        if (!this.didClient.authenticated()) {
            this.didClient.authenticate(
                this.wallet.privateKey,
                this.autoConfig.didClientConfig.callType,
                this.autoConfig.didClientConfig.web3Config,
                this.autoConfig.didClientConfig.didEndpoints
            )
        }
    }
}