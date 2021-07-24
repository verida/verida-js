import { AccountInterface } from '@verida/account'
import { Interfaces } from '@verida/storage-link'

import BaseStorageEngine from './engines/base'
import { StorageEngineTypes } from './interfaces'
import StorageEngineVerida from './engines/verida/engine'
import DIDContextManager from '../did-context-manager'
import { StorageEngines } from '../interfaces'
import { Database, DatabaseOpenConfig } from './engines/interfaces'

const STORAGE_ENGINES: StorageEngineTypes = {
    'VeridaStorage': StorageEngineVerida
}

/**
 * Storage for an authenticated user
 */
export default class Context {

    private account?: AccountInterface
    private contextName: string
    private didContextManager: DIDContextManager
    private storageEngines: StorageEngines = {}

    constructor(contextName: string, didContextManager: DIDContextManager, account?: AccountInterface) {
        this.contextName = contextName
        this.didContextManager = didContextManager

        if (account) {
            this.account = account
        }
    }

    public async getStorageConfig(did?: string): Promise<Interfaces.SecureStorageContextConfig> {
        if (!did) {
            if (!this.account) {
                throw new Error('No DID specified and no authenticated user')
            }

            did = await this.account.did()
        }

        return this.didContextManager.getDIDContextConfig(did, this.contextName, false)
    }    

    /**
     * Get a storage engine for a given DID and this contextName
     * 
     * @param did 
     * @returns 
     */
    private async getStorageEngine(did: string): Promise<BaseStorageEngine> {
        if (this.storageEngines[did]) {
            return this.storageEngines[did]
        }

        const storageConfig = await this.getStorageConfig(did)

        const engineType = storageConfig.services.storageServer.type

        if (!STORAGE_ENGINES[engineType]) {
            throw new Error(`Unsupported storage engine type specified: ${engineType}`)
        }
        const engine = STORAGE_ENGINES[engineType]  // @todo type cast correctly
        const storageEngine = new engine(storageConfig.id, storageConfig.services.storageServer.endpointUri)
        
        /**
         * If we're opening a database controlled by the currently authenticated
         * DID, then connect them
         */
        const accountDid = await this.account!.did()
        if (this.account && accountDid == did) {
            storageEngine.connectAccount(this.account)
        }

        // cache storage engine for this did and context
        this.storageEngines[did] = storageEngine
        return storageEngine
    }

    /**
     * Open a database owned by this user
     * 
     * @param databaseName 
     * @param options 
     * @returns 
     */
    public async openDatabase(databaseName: string, options: DatabaseOpenConfig): Promise<Database> {
        if (!this.account) {
            throw new Error(`Unable to open database. No authenticated user.`)
        }

        const accountDid = await this.account!.did()
        const storageEngine = await this.getStorageEngine(accountDid)
        return storageEngine.openDatabase(databaseName, options)
    }

    /**
     * Open a database owned by any user
     */
    public async openExternalDatabase(databaseName: string, did: string, options: DatabaseOpenConfig): Promise<Database> {
        const storageEngine = await this.getStorageEngine(did)
        return storageEngine.openDatabase(databaseName, options)
    }

}