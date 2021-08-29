import { AccountInterface } from '@verida/account'
import { Interfaces } from '@verida/storage-link'

import BaseStorageEngine from './engines/base'
import { StorageEngineTypes } from './interfaces'
import DIDContextManager from '../did-context-manager'
import { DatabaseEngines } from '../interfaces'
import { DatabaseOpenConfig, DatastoreOpenConfig } from './interfaces'
import Database from './database'
import Datastore from './datastore'
import Messaging from './messaging'
import Client from '../client'

const _ = require('lodash')

import StorageEngineVerida from './engines/verida/database/engine'
const DATABASE_ENGINES: StorageEngineTypes = {
    'VeridaDatabase': StorageEngineVerida
}

import MessagingEngineVerida from './engines/verida/messaging/engine'

const MESSAGING_ENGINES: StorageEngineTypes = {
    'VeridaMessage': MessagingEngineVerida
}

/**
 * Storage for an authenticated user
 */
export default class Context {

    private client: Client
    private account?: AccountInterface
    private messagingEngine?: Messaging

    private contextName: string
    private didContextManager: DIDContextManager
    private databaseEngines: DatabaseEngines = {}

    constructor(client: Client, contextName: string, didContextManager: DIDContextManager, account?: AccountInterface) {
        this.client = client
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

    public getAccount(): AccountInterface {
        return this.account!
    }

    public getDidContextManager(): DIDContextManager {
        return this.didContextManager
    }

    public getClient(): Client {
        return this.client
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

        if (!DATABASE_ENGINES[engineType]) {
            throw new Error(`Unsupported database engine type specified: ${engineType}`)
        }
        const engine = DATABASE_ENGINES[engineType]  // @todo type cast correctly
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

    private async getMessagingEngine(): Promise<Messaging> {
        if (this.messagingEngine) {
            return this.messagingEngine
        }

        if (!this.account) {
            throw new Error(`Unable to open messaging. No authenticated user.`)
        }

        const did = await this.account!.did()
        const contextConfig = await this.getContextConfig(did)
        const engineType = contextConfig.services.messageServer.type

        if (!MESSAGING_ENGINES[engineType]) {
            throw new Error(`Unsupported messaging engine type specified: ${engineType}`)
        }
        const engine = MESSAGING_ENGINES[engineType]  // @todo type cast correctly
        const keyring = await this.account!.keyring(this.contextName)
        const accountDid = await this.account!.did()

        this.messagingEngine = new engine(this, contextConfig.services.messageServer.endpointUri)
        this.messagingEngine!.connectAccount(this.account!)

        return this.messagingEngine!
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

    public async openExternalDatastore(schemaName: string, did: string, config: DatastoreOpenConfig = {}): Promise<Datastore> {
        throw new Error('Not implemented')
    }

    

}