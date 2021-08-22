import { AccountInterface } from '@verida/account'
import { Interfaces } from '@verida/storage-link'

import BaseStorageEngine from './engines/base'
import { StorageEngineTypes } from './interfaces'
import StorageEngineVerida from './engines/verida/engine'
import DIDContextManager from '../did-context-manager'
import { DatabaseEngines } from '../interfaces'
import { DatabaseOpenConfig, DatastoreOpenConfig } from './interfaces'
import Database from './database'
import Datastore from './datastore'

const _ = require('lodash')

const STORAGE_ENGINES: StorageEngineTypes = {
    'VeridaDatabase': StorageEngineVerida,
    'VeridaMessage': StorageEngineVerida
}

/**
 * Storage for an authenticated user
 */
export default class Context {

    private account?: AccountInterface
    private contextName: string
    private didContextManager: DIDContextManager
    private databaseEngines: DatabaseEngines = {}

    constructor(contextName: string, didContextManager: DIDContextManager, account?: AccountInterface) {
        this.contextName = contextName
        this.didContextManager = didContextManager

        this.account = account
    }

    public async getContextConfig(did?: string): Promise<Interfaces.SecureContextConfig> {
        if (!did) {
            if (!this.account) {
                throw new Error('No DID specified and no authenticated user')
            }

            did = await this.account.did()
        }

        return this.didContextManager.getDIDContextConfig(did, this.contextName, false)
    }

    public getContextName(): string {
        return this.contextName
    }

    /**
     * Get a storage engine for a given DID and this contextName
     * 
     * @param did 
     * @returns 
     */
    private async getDatabaseEngine(did: string): Promise<BaseStorageEngine> {
        if (this.databaseEngines[did]) {
            return this.databaseEngines[did]
        }

        const contextConfig = await this.getContextConfig(did)
        const engineType = contextConfig.services.databaseServer.type

        if (!STORAGE_ENGINES[engineType]) {
            throw new Error(`Unsupported database engine type specified: ${engineType}`)
        }
        const engine = STORAGE_ENGINES[engineType]  // @todo type cast correctly
        const databaseEngine = new engine(this.contextName, contextConfig.services.databaseServer.endpointUri)
        
        /**
         * Connect the current user if we have one
         */
        if (this.account) {
            await databaseEngine.connectAccount(this.account)
        }

        // cache storage engine for this did and context
        this.databaseEngines[did] = databaseEngine
        return databaseEngine
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
        const databaseEngine = await this.getDatabaseEngine(accountDid)
        return databaseEngine.openDatabase(databaseName, options)
    }

    /**
     * Open a database owned by any user
     */
    public async openExternalDatabase(databaseName: string, did: string, options: DatabaseOpenConfig): Promise<Database> {
        const databaseEngine = await this.getDatabaseEngine(did)
        const contextConfig = await this.getContextConfig(did)

        options = _.merge({
            did,
            dsn: contextConfig.services.databaseServer.endpointUri
        }, options)

        return databaseEngine.openDatabase(databaseName, options)
    }

    public async openDatastore(schemaName: string, config: DatastoreOpenConfig = {}): Promise<Datastore> {
        if (!this.account) {
            throw new Error(`Unable to open datastore. No authenticated user.`)
        }

        // @todo: Should this also call _init to confirm everything is good?
        return new Datastore(schemaName, this, config)
    }

}