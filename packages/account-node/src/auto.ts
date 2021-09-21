import CeramicClient from '@ceramicnetwork/http-client'
import { Interfaces, StorageLink, DIDStorageConfig } from '@verida/storage-link'
import { Utils } from '@verida/3id-utils-node'
import { Keyring } from '@verida/keyring'
import { Account, AccountConfig } from '@verida/account'
import { NodeAccountConfig } from './interfaces'

import { DagJWS } from 'dids'

// Pulled from https://github.com/ceramicnetwork/js-did/blob/bc5271f7e659d073e150389828c021156a80e6d0/src/utils.ts#L29
function fromDagJWS(jws: DagJWS): string {
    if (jws.signatures.length > 1) throw new Error('Cant convert to compact jws')
    return `${jws.signatures[0].protected}.${jws.payload}.${jws.signatures[0].signature}`
}

/**
 * An Authenticator that automatically signs everything
 */
export default class AutoAccount extends Account {

    private chain: string
    private privateKey: string
    private utils: Utils

    private ceramic?: CeramicClient

    protected accountConfig: AccountConfig

    constructor(accountConfig: AccountConfig, autoConfig: NodeAccountConfig) {
        super()
        this.accountConfig = accountConfig
        this.utils = new Utils(autoConfig.ceramicUrl)
        this.chain = autoConfig.chain
        this.privateKey = autoConfig.privateKey
    }

    private async init() {
        if (this.ceramic) {
            return
        }

        this.ceramic = await this.utils.createAccount(this.chain, this.privateKey)

        if (!this.ceramic!.did) {
            throw new Error('Ceramic client is not authenticated with a valid DID')
        }
    }

    public async keyring(contextName: string): Promise<Keyring> {
        await this.init()
        const did = await this.did()
        const consentMessage = `Do you wish to unlock this storage context: "${contextName}"?\n\n${did}`
        const signature = await this.sign(consentMessage)
        return new Keyring(signature)
    }

    // returns a compact JWS
    public async sign(message: string): Promise<string> {
        await this.init()
        const input = {
            message
        }
        const jws = await this.ceramic!.did!.createJWS(input)

        return fromDagJWS(jws)
    }

    public async did(): Promise<string> {
        await this.init()
        return this.ceramic!.did!.id
    }

    public async storageConfig(contextName: string, forceCreate?: boolean): Promise<Interfaces.SecureContextConfig | undefined> {
        let storageConfig = await StorageLink.getLink(this.ceramic!, this.ceramic!.did!.id, contextName, true)
        
        if (!storageConfig && forceCreate) {
            const endpoints: Interfaces.SecureContextServices = {
                databaseServer: this.accountConfig.defaultDatabaseServer,
                messageServer: this.accountConfig.defaultMessageServer
            }

            if (this.accountConfig.defaultStorageServer) {
                endpoints.storageServer = this.accountConfig.defaultStorageServer
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
        await this.init()
        await StorageLink.setLink(this.ceramic!, this.ceramic!.did!.id, storageConfig)
     }

     /**
      * Unlink storage for this user
      * 
      * @param contextName 
      */
    public async unlinkStorage(contextName: string): Promise<boolean> {
        await this.init()
        return await StorageLink.unlink(this.ceramic!, this.ceramic!.did!.id, contextName)
    }

    public async getCeramic(): Promise<CeramicClient> {
        await this.init()
        return this.ceramic!
    }

}