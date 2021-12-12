import { Interfaces, StorageLink, DIDStorageConfig } from '@verida/storage-link'
import { Keyring } from '@verida/keyring'
import { Account, AccountConfig, Config } from '@verida/account'
import { NodeAccountConfig } from './interfaces'

import { DIDClient, Wallet } from '@verida/did-client'
import EncryptionUtils from "@verida/encryption-utils"

/**
 * An Authenticator that automatically signs everything
 */
export default class AutoAccount extends Account {

    private privateKey: string
    private didClient: DIDClient

    private wallet: Wallet
    protected accountConfig: AccountConfig

    constructor(accountConfig: AccountConfig, autoConfig: NodeAccountConfig) {
        super()
        this.accountConfig = accountConfig
        this.wallet = new Wallet(autoConfig.privateKey)

        const didServerUrl = autoConfig.didServerUrl ? autoConfig.didServerUrl : Config.environments[autoConfig.environment].didServerUrl
        this.didClient = new DIDClient(didServerUrl)
        
        this.privateKey = this.wallet.privateKey
        this.didClient.authenticate(this.privateKey)
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
        let storageConfig = await StorageLink.getLink(this.didClient, this.wallet.did, contextName, true)
        
        if (!storageConfig || forceCreate) {
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
        await StorageLink.setLink(this.didClient, storageConfig)
     }

     /**
      * Unlink storage for this user
      * 
      * @param contextName 
      */
    public async unlinkStorage(contextName: string): Promise<boolean> {
        return await StorageLink.unlink(this.didClient, contextName)
    }

    public getDidClient() {
        return this.didClient
    }

}