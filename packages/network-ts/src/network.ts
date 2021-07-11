import { Interfaces } from '@verida/storage-link'
import { StorageLink, DIDStorageConfig } from '@verida/storage-link'
import { AccountInterface } from '@verida/account'
import CeramicClient from '@ceramicnetwork/http-client'

import { ManagerConfig, StorageConnections } from './interfaces'
import BaseStorage from './context/base'
import AccountContext from './context/account'

const DEFAULT_CERAMIC_URL = 'http://localhost:7001/'

export default class Network {

    public defaultStorageServer: Interfaces.SecureStorageServer
    public defaultMessageServer: Interfaces.SecureStorageServer
    public ceramicUrl: string
    
    private storageConnections: StorageConnections = {}
    private ceramic: CeramicClient

    private account?: AccountInterface
    private did?: string

    constructor(config: ManagerConfig) {
        this.defaultStorageServer = config.defaultMessageServer
        this.defaultMessageServer = config.defaultStorageServer

        this.ceramicUrl = config.ceramicUrl ? config.ceramicUrl : DEFAULT_CERAMIC_URL
        this.ceramic = new CeramicClient(this.ceramicUrl)
    }

    /**
     * Connect a DID to this instance. Effectively sets the owner who can
     * then create storage contexts, authenticate with databases etc.
     * 
     * @param ceramic 
     */
    public async connect(account: AccountInterface) {
        this.account = account
        this.did = await this.account!.did()
    }

    public isConnected() {
        return this.did ? true : false
    }

    /**
     * Get a storage context for the current user
     */
    public async openContext(contextName: string, forceCreate: boolean): Promise<BaseStorage | undefined> {
        if (this.storageConnections[contextName]) {
            return this.storageConnections[contextName]
        }

        // Storage not in local cache, need to try and load it from the user's saved secure storage index
        if (!this.did || !this.account) {
            throw new Error('Unable to locate requested storage context for this user -- Not authenticated')
        }

        let storageConfig = await StorageLink.getLink(this.ceramic, this.did, contextName)

        if (!storageConfig) {
            if (!forceCreate) {
                throw new Error('Unable to locate requested storage context for this user -- Storage context doesn\'t exist (try force create?)')
            }

            // Force creation of storage context
            storageConfig = await DIDStorageConfig.generate(this.account, contextName, {
                storageServer: this.defaultStorageServer,
                messageServer: this.defaultMessageServer
            })

            await this.account!.linkStorage(storageConfig)
        }

        return new AccountContext(storageConfig, this.account)
    }

    /**
     * Get a storage connection for an external DID
     * 
     * @param did 
     * @param storageName 
     */
    /*public async openExternalStorageContext(did: string, storageName: string): Promise<External | undefined> {
        const connection = this.findConnection(did)

        // did -> storage connection instance -> get() -- if fails, throw error -> create StorageExternal
        const storageIndex = await connection.get(did, storageName)
        if (!storageIndex) {
            return
        }

        return new External(did, storageIndex)
    }*/

}