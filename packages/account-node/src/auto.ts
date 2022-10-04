import { Interfaces, StorageLink, DIDStorageConfig } from '@verida/storage-link'
import { Keyring } from '@verida/keyring'
import { Account, AccountConfig, Config } from '@verida/account'
import { NodeAccountConfig } from './interfaces'

import { DIDClient, Wallet } from '@verida/did-client'
import EncryptionUtils from "@verida/encryption-utils"
import { Interfaces as DIDDocumentInterfaces } from "@verida/did-document"
import { Wallet as EthersWallet } from "ethers"
import { JsonRpcProvider } from '@ethersproject/providers'

/**
 * An Authenticator that automatically signs everything
 */
export default class AutoAccount extends Account {

    private didClient: DIDClient

    private wallet: Wallet
    protected accountConfig: AccountConfig

    constructor(accountConfig: AccountConfig, autoConfig: NodeAccountConfig) {
        super()
        this.accountConfig = accountConfig
        this.wallet = new Wallet(autoConfig.privateKey)

        this.didClient = new DIDClient({
            ...autoConfig.didClientConfig,
            network: <'testnet' | 'mainnet'> autoConfig.environment
        })

        if (autoConfig.didClientConfig.callType == 'web3') {
            const provider = new JsonRpcProvider(autoConfig.didClientConfig.rpcUrl)
            const txSigner = new EthersWallet(autoConfig.didClientConfig.networkPrivateKey, provider)
            // @ts-ignore Why doesn't pickup the interfaces?
            autoConfig.didClientConfig.web3Config.provider = provider
            // @ts-ignore Why doesn't pickup the interfaces?
            autoConfig.didClientConfig.web3Config.signer = txSigner
        }

        this.didClient.authenticate(
            autoConfig.didClientConfig.networkPrivateKey,
            autoConfig.didClientConfig.callType,
            autoConfig.didClientConfig.web3Config
        )
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

    /**
     * Link storage context service endpoint
     * 
     */
    public async linkStorageContextService(contextName: string, endpointType: DIDDocumentInterfaces.EndpointType, serverType: string, endpointUri: string) {
        return await StorageLink.setContextService(this.didClient, contextName, endpointType, serverType, endpointUri)
    }

    public getDidClient() {
        return this.didClient
    }

}