import { Account } from '@verida/account'
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
import { Profile } from './profiles/profile'

const _ = require('lodash')

import StorageEngineVerida from './engines/verida/database/engine'
const DATABASE_ENGINES: StorageEngineTypes = {
    'VeridaDatabase': StorageEngineVerida
}

import MessagingEngineVerida from './engines/verida/messaging/engine'
import DbRegistry from './db-registry'

const MESSAGING_ENGINES: StorageEngineTypes = {
    'VeridaMessage': MessagingEngineVerida
}

/**
 * An application context is a silo'd container of data for a specific application.
 * 
 * It supports:
 * 
 * - Database storage (encrypted, public, permissioned, queries, indexes)
 * - Messaging (between users and applications)
 * - Block storage (large files such as images and video) -- Coming soon
 */
export default class Context {

    private client: Client
    private account?: Account
    private messagingEngine?: Messaging

    private contextName: string
    private didContextManager: DIDContextManager
    private databaseEngines: DatabaseEngines = {}
    private dbRegistry: DbRegistry

    /**
     * Instantiate a new context.
     * 
     * **Do not use directly**. Use `client.openContext()` or `Network.connect()`.
     * 
     * @param client {Client}
     * @param contextName {string}
     * @param didContextManager {DIDContextManager}
     * @param account {AccountInterface}
     */
    constructor(client: Client, contextName: string, didContextManager: DIDContextManager, account?: Account) {
        this.client = client
        this.contextName = contextName
        this.didContextManager = didContextManager
        this.account = account
        this.dbRegistry = new DbRegistry(this)
    }

    public async getContextConfig(did?: string, forceCreate?: boolean, customContextName?: string): Promise<Interfaces.SecureContextConfig> {
        if (!did) {
            if (!this.account) {
                throw new Error('No DID specified and no authenticated user')
            }

            did = await this.account.did()
        }

        return this.didContextManager.getDIDContextConfig(did!, customContextName ? customContextName : this.contextName, forceCreate)
    }

    public getContextName(): string {
        return this.contextName
    }

    public getAccount(): Account {
        return this.account!
    }

    public getDidContextManager(): DIDContextManager {
        return this.didContextManager
    }

    public getClient(): Client {
        return this.client
    }

    public async disconnect(): Promise<boolean> {
        if (this.account) {
            await this.account.disconnect(this.contextName)
            this.account = undefined
            return true
        }

        return false
    }

    /**
     * Get a storage engine for a given DID and this contextName
     * 
     * @param did 
     * @returns 
     */
    private async getDatabaseEngine(did: string, createContext?: boolean): Promise<BaseStorageEngine> {
        if (this.databaseEngines[did]) {
            return this.databaseEngines[did]
        }

        const contextConfig = await this.getContextConfig(did, createContext)
        const engineType = contextConfig.services.databaseServer.type

        if (!DATABASE_ENGINES[engineType]) {
            throw new Error(`Unsupported database engine type specified: ${engineType}`)
        }
        const engine = DATABASE_ENGINES[engineType]  // @todo type cast correctly
        const databaseEngine = new engine(this.contextName, this.dbRegistry, contextConfig.services.databaseServer.endpointUri)
        
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
     * Get a messaging instance for this application context.
     * 
     * Allows you to send and receive messages as the currently connected account.
     * 
     * @returns {Messaging} Messaging instance
     */
    public async getMessaging(): Promise<Messaging> {
        if (this.messagingEngine) {
            return this.messagingEngine
        }

        if (!this.account) {
            throw new Error(`Unable to open messaging. No authenticated user.`)
        }

        const did = await this.account!.did()

        // Force create as we require the current user to have an account to send / receive messages
        const contextConfig = await this.getContextConfig(did, true)
        const engineType = contextConfig.services.messageServer.type

        if (!MESSAGING_ENGINES[engineType]) {
            throw new Error(`Unsupported messaging engine type specified: ${engineType}`)
        }
        const engine = MESSAGING_ENGINES[engineType]  // @todo type cast correctly

        this.messagingEngine = new engine(this, contextConfig.services.messageServer.endpointUri)
        await this.messagingEngine!.connectAccount(this.account!)

        return this.messagingEngine!
    }

    /**
     * Get a user's profile.
     * 
     * @param profileName string Name of the Verida profile schema to load
     * @param did string DID of the profile to get. Leave blank to fetch a read/write profile for the currently authenticated user
     */
    public async openProfile(profileName: string = "public", did?: string, writeAccess?: boolean): Promise<Profile | undefined> {
        let ownAccount = false
        if (!did) {
            if (!this.account) {
                throw new Error("Unable to get profile. No DID specified and no account connected.")
            }

            did = await this.account.did()
            ownAccount = true
        }

        return new Profile(this, did!, profileName, ownAccount)
    }

    /**
     * Open a database owned by this account.
     * 
     * @param databaseName {string} Name of the database to open
     * @param options {DatabaseOpenConfig} Optional database configuration
     * 
     * @returns {Promise<Database>}
     */
    public async openDatabase(databaseName: string, config: DatabaseOpenConfig = {}): Promise<Database> {
        if (!this.account) {
            throw new Error(`Unable to open database. No authenticated user.`)
        }

        const accountDid = await this.account!.did()
        const databaseEngine = await this.getDatabaseEngine(config.did ? config.did : accountDid, config.createContext!)

        if (!config.signingContext) {
            config.signingContext = this
        }

        const database = await databaseEngine.openDatabase(databaseName, config)
        if (config.saveDatabase !== false) {
            await this.dbRegistry.saveDb(database, false)
        }

        return database
    }

    /**
     * Open an external database owned by an account that isn't the currently connected account.
     * 
     * @param databaseName {string} Name of the database to open
     * @param did {string} DID of the external account that owns the database
     * @param options {DatabaseOpenConfig} Optional database configuration
     * @returns 
     */
    public async openExternalDatabase(databaseName: string, did: string, config: DatabaseOpenConfig = {}): Promise<Database> {
        let contextConfig
        if (!config.dsn) {
            contextConfig = await this.getContextConfig(did, false, config.contextName ? config.contextName : this.contextName)
            config.dsn = contextConfig.services.databaseServer.endpointUri
        }

        config = _.merge({
            did,
            signingContext: this
        }, config)

        config.saveDatabase = false

        if (config.contextName && config.contextName != this.contextName) {
            // We are opening a database for a different context.
            // Open the new context
            const client = this.getClient()
            const context = await client.openExternalContext(config.contextName!, did)
            config.signingContext = this

            return context!.openDatabase(databaseName, config)
        }

        const databaseEngine = await this.getDatabaseEngine(did)

        return databaseEngine.openDatabase(databaseName, config)
    }

    /**
     * Open a dataastore owned by this account.
     * 
     * @param schemaUri {string} URI of the schema to open (ie: https://schemas.verida.io/social/contact/schema.json)
     * @param config {DatastoreOpenConfig} Optional datastore configuration
     * @returns 
     */
    public async openDatastore(schemaUri: string, config: DatastoreOpenConfig = {}): Promise<Datastore> {
        if (!this.account) {
            throw new Error(`Unable to open datastore. No authenticated user.`)
        }

        // @todo: Should this also call _init to confirm everything is good?
        return new Datastore(schemaUri, this, config)
    }

    /**
     * Open an external datastore owned by an account that isn't the currently connected account.
     * 
     * @param schemaUri {string} URI of the schema to open (ie: https://schemas.verida.io/social/contact/schema.json)
     * @param did {string} DID of the external account that owns the database
     * @param options {DatabaseOpenConfig} Optional database configuration
     * @returns 
     */
    public async openExternalDatastore(schemaUri: string, did: string, options: DatastoreOpenConfig = {}): Promise<Datastore> {
        //const contextConfig = await this.getContextConfig(did, false)

        options = _.merge({
            did,
            //dsn: contextConfig.services.databaseServer.endpointUri,
            external: true
        }, options)

        // @todo: Should this also call _init to confirm everything is good?
        return new Datastore(schemaUri, this, options)
    }

    public getDbRegistry(): DbRegistry {
        return this.dbRegistry
    }

}