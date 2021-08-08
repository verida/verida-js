import { AccountInterface } from '@verida/account'
import { Interfaces } from '@verida/storage-link'

import BaseStorageEngine from './engines/base'
import { StorageEngineTypes } from './interfaces'
import StorageEngineVerida from './engines/verida/engine'
import DIDContextManager from '../did-context-manager'
import { StorageEngines } from '../interfaces'
import { DatabaseOpenConfig, DatastoreOpenConfig } from './interfaces'
import Database from './database'
import Datastore from './datastore'

const _ = require('lodash')

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

        this.account = account
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

    public getContextName(): string {
        return this.contextName
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
        const storageEngine = new engine(this.contextName, storageConfig.services.storageServer.endpointUri)
        
        /**
         * Connect the current user if we have one
         */
        if (this.account) {
            await storageEngine.connectAccount(this.account)
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
        const storageConfig = await this.getStorageConfig(did)
        options = _.merge({
            did,
            dsn: storageConfig.services.storageServer.endpointUri
        }, options)

        return storageEngine.openDatabase(databaseName, options)
    }

    // @todo
    /*async openDatastore(schemaName: string, config: DatastoreOpenConfig): Promise<Datastore> {
        config = _.merge({
            permissions: {
                read: "owner",
                write: "owner"
            },
            user: this._user,
            did: this.config.did
        }, config);

        // Default to user's did if not specified
        let did = config.did;
        if (config.user) {
            did = config.did || config.user.did;
            config.isOwner = (did == (config.user ? config.user.did : false));
        }

        if (!did) {
            throw new Error("No DID specified in config and no user connected");
        }

        did = did.toLowerCase();

        let datastoreName = config.dbName ? config.dbName : schemaName;

        let dsHash = Utils.md5FromArray([
            datastoreName,
            did,
            config.readOnly ? true : false
        ]);

        if (this._datastores[dsHash]) {
            return this._datastores[dsHash];
        }

        // If permissions require "owner" access, connect the current user
        if ((config.permissions.read == "owner" || config.permissions.write == "owner") && !(config.readOnly === true)) {
            if (!config.user) {
                throw new Error("Unable to open database. Permissions require \"owner\" access, but no user supplied in config.");
            }

            await this.connect(config.user, true);
        }

        this._datastores[dsHash] = new Datastore(this, schemaName, did, this.appName, config);

        return this._datastores[dsHash];
    }*/

}