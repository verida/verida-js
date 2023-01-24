import { EventEmitter } from 'events'
import { Account } from "@verida/account";
import DIDContextManager from "../did-context-manager";
import Datastore from "./datastore";
import Client from "../client";
import { Profile } from "./profiles/profile";

import StorageEngineVerida from "./engines/verida/database/engine";
import MessagingEngineVerida from "./engines/verida/messaging/engine";
import DbRegistry from "./db-registry";
import NotificationEngineVerida from './engines/verida/notification/engine'
import {
  DatabaseEngines,
  IAccount,
  IContext,
  IDatabase,
  StorageEngineTypes,
  IMessaging,
  INotification,
  MessagesConfig,
  DatabaseOpenConfig,
  DatastoreOpenConfig,
  ContextInfo,
  ContextEngineType,
  ContextCloseOptions,
  DatabaseCloseOptions,
  SecureContextConfig,
  AuthTypeConfig,
  AuthContext,
  IStorageEngine
} from '@verida/types';

const _ = require("lodash");


const DATABASE_ENGINES: StorageEngineTypes = {
  VeridaDatabase: StorageEngineVerida,
};


const MESSAGING_ENGINES: StorageEngineTypes = {
  VeridaMessage: MessagingEngineVerida,
};


const NOTIFICATION_ENGINES: StorageEngineTypes = {
  VeridaNotification: NotificationEngineVerida,
};

/**
 * An application context is a silo'd container of data for a specific application.
 *
 * It supports:
 *
 * - Database storage (encrypted, public, permissioned, queries, indexes)
 * - Messaging (between users and applications)
 * - Block storage (large files such as images and video) -- Coming soon
 */

/**
 * @category
 * Modules
 */
class Context extends EventEmitter implements IContext {
  private client: Client;
  private account?: Account;
  private messagingEngine?: IMessaging;
  private notificationEngine?: INotification

  private contextName: string;
  private didContextManager: DIDContextManager;
  private databaseEngines: DatabaseEngines = {};
  private dbRegistry: DbRegistry;

  private databaseCache: Record<string, IDatabase | Promise<IDatabase>> = {}

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
  constructor(
    client: Client,
    contextName: string,
    didContextManager: DIDContextManager,
    account?: IAccount
  ) {
    super()

    this.client = client;
    this.contextName = contextName;
    this.didContextManager = didContextManager;
    this.account = <Account> account;
    this.dbRegistry = new DbRegistry(this);
  }

  public async getContextConfig(
    did?: string,
    forceCreate?: boolean,
    customContextName?: string
  ): Promise<SecureContextConfig> {
    if (!did) {
      if (!this.account) {
        throw new Error("No DID specified and no authenticated user");
      }

      did = await this.account.did();
    }

    return this.didContextManager.getDIDContextConfig(
      did!,
      customContextName ? customContextName : this.contextName,
      forceCreate
    );
  }

  public getContextName(): string {
    return this.contextName;
  }

  public getAccount(): IAccount {
    return this.account!;
  }

  public getDidContextManager(): DIDContextManager {
    return this.didContextManager;
  }

  public getClient(): Client {
    return this.client;
  }

  public async disconnect(): Promise<boolean> {
    if (this.account) {
      await this.account.disconnect(this.contextName);
      this.account = undefined;
      return true;
    }

    return false;
  }

  /**
   * Get a storage engine for a given DID and this contextName
   *
   * @param did
   * @returns {BaseStorageEngine}
   */
  public async getDatabaseEngine(
    did: string,
    createContext?: boolean
  ): Promise<IStorageEngine> {
    if (this.databaseEngines[did]) {
      return this.databaseEngines[did];
    }

    const contextConfig = await this.getContextConfig(did, createContext);
    const engineType = contextConfig.services.databaseServer.type;

    if (!DATABASE_ENGINES[engineType]) {
      throw new Error(
        `Unsupported database engine type specified: ${engineType}`
      );
    }

    const engine = DATABASE_ENGINES[engineType]; // @todo type cast correctly
    const databaseEngine = new engine(
      this,
      this.dbRegistry,
      contextConfig
    );

    /**
     * Connect the current user if we have one
     */
    if (this.account) {
      await databaseEngine.connectAccount(this.account);
    }

    // Listen and re-emit endpoint warnings and errors
    const context = this
    databaseEngine.on('EndpointUnavailable', (endpointUri: string) => {
      context.emit('EndpointWarning', endpointUri)
    })

    databaseEngine.on('EndpointWarning', (endpointUri: string, message: string) => {
      context.emit('EndpointWarning', endpointUri, message)
    })

    // cache storage engine for this did and context
    this.databaseEngines[did] = databaseEngine;
    return databaseEngine;
  }

  /**
   * Get a messaging instance for this application context.
   *
   * Allows you to send and receive messages as the currently connected account.
   *
   * @returns {Messaging} Messaging instance
   */
  public async getMessaging(messageConfig: MessagesConfig = {}): Promise<IMessaging> {
    if (this.messagingEngine) {
      return this.messagingEngine;
    }

    if (!this.account) {
      throw new Error(`Unable to open messaging. No authenticated user.`);
    }

    const did = await this.account!.did();

    // Force create as we require the current user to have an account to send / receive messages
    const contextConfig = await this.getContextConfig(did, true);
    const engineType = contextConfig.services.messageServer.type;

    if (!MESSAGING_ENGINES[engineType]) {
      throw new Error(
        `Unsupported messaging engine type specified: ${engineType}`
      );
    }
    const engine = MESSAGING_ENGINES[engineType]; // @todo type cast correctly

    this.messagingEngine = new engine(
      this,
      messageConfig
    );
    await this.messagingEngine!.connectAccount(this.account!);

    return this.messagingEngine!;
  }

  public async getNotification(did: string, contextName: string): Promise<INotification | undefined> {
    if (!this.account) {
      throw new Error(`Unable to open notification. No authenticated user.`);
    }

    const contextConfig = await this.didContextManager.getDIDContextConfig(
      did,
      contextName,
      false
    );

    if (!contextConfig || !contextConfig.services.notificationServer) {
      // User doesn't have a notification service
      return
    }

    const engineType = contextConfig.services.notificationServer.type;

    if (!NOTIFICATION_ENGINES[engineType]) {
      throw new Error(
        `Unsupported messaging engine type specified: ${engineType}`
      );
    }
    const engine = NOTIFICATION_ENGINES[engineType];

    this.notificationEngine = new engine(
      this.contextName,
      await this.account.keyring(this.contextName),
      contextName,
      did,
      contextConfig.services.notificationServer.endpointUri
    );

    return this.notificationEngine!;
  }

  /**
   * Get a user's profile.
   *
   * @param profileName string Name of the Verida profile schema to load
   * @param did string DID of the profile to get. Leave blank to fetch a read/write profile for the currently authenticated user
   * @returns {Profile}
   */
  public async openProfile(
    profileName: string = "basicProfile",
    did?: string,
    writeAccess?: boolean
  ): Promise<Profile | undefined> {
    let ownAccount = false;
    if (!did) {
      if (!this.account) {
        throw new Error(
          "Unable to get profile. No DID specified and no account connected."
        );
      }

      did = await this.account.did();
      ownAccount = true;
    }

    return new Profile(this, did!, profileName, ownAccount);
  }

  /**
   * Open a database owned by this account.
   *
   * @param databaseName {string} Name of the database to open
   * @param options {DatabaseOpenConfig} Optional database configuration
   *
   * @returns {Promise<Database>}
   */
  public async openDatabase(
    databaseName: string,
    config: DatabaseOpenConfig = {}
  ): Promise<IDatabase> {
    if (!this.account) {
      throw new Error(`Unable to open database. No authenticated user.`);
    }

    const accountDid = await this.account!.did();
    if (!config.did) {
      config.did = accountDid;
    }

    config.did = config.did.toLowerCase()

    const cacheKey = `${config.did}/${databaseName}/internal`

    if (this.databaseCache[cacheKey] && !config.ignoreCache) {
      return this.databaseCache[cacheKey]
    }

    const instance = this
    this.databaseCache[cacheKey] = new Promise(async (resolve, rejects) => {
      //const now = (new Date()).getTime()
      try {
        const databaseEngine = await instance.getDatabaseEngine(
          config.did!,
          config.createContext!
        );

        if (!config.signingContext) {
          config.signingContext = instance;
        }
        const database = await databaseEngine.openDatabase(databaseName, config);
        if (config.saveDatabase !== false) {
          await instance.dbRegistry.saveDb(database, false);
        }
    
        instance.databaseCache[cacheKey] = database;

        //console.log(`openDatabase(${databaseName}, ${config.did}): ${(new Date()).getTime()-now}`)
        resolve(database);
      } catch (err: any) {
        rejects(err)
      }
    })

    return this.databaseCache[cacheKey]
  }

  /**
   * Open an external database owned by an account that isn't the currently connected account.
   *
   * @param databaseName {string} Name of the database to open
   * @param did {string} DID of the external account that owns the database
   * @param options {DatabaseOpenConfig} Optional database configuration
   * @returns {Database}
   */
  public async openExternalDatabase(
    databaseName: string,
    did: string,
    config: DatabaseOpenConfig = {}
  ): Promise<IDatabase> {
    did = did.toLowerCase()
    const cacheKey = `${did}/${databaseName}/external`
    if (this.databaseCache[cacheKey] && !config.ignoreCache) {
      return this.databaseCache[cacheKey]
    }

    let contextConfig;
    if (!config.endpoints) {
      contextConfig = await this.getContextConfig(
        did,
        false,
        config.contextName ? config.contextName : this.contextName
      );

      config.endpoints = <string[]> contextConfig.services.databaseServer.endpointUri
    }

    config = _.merge(
      {
        did,
        signingContext: this,
        permissions: {
          read: "users",
          write: "users",
        },
      },
      config
    );

    config.isOwner = false;

    config.saveDatabase = false;
    if (config.contextName && config.contextName != this.contextName) {
      // We are opening a database for a different context.
      // Open the new context
      const client = this.getClient();
      const context = await client.openExternalContext(
        config.contextName!,
        did
      );
      config.signingContext = this;

      return await context!.openDatabase(databaseName, config);
    }

    const databaseEngine = await this.getDatabaseEngine(did);
    const database = await databaseEngine.openDatabase(databaseName, config);

    // Add to cache of databases
    this.databaseCache[cacheKey] = database
    return database
  }

  /**
   * Open a dataastore owned by this account.
   *
   * @param schemaUri {string} URI of the schema to open (ie: https://common.schemas.verida.io/health/activity/latest/schema.json)
   * @param config {DatastoreOpenConfig} Optional datastore configuration
   * @returns {Datastore}
   */
  public async openDatastore(
    schemaUri: string,
    config: DatastoreOpenConfig = {}
  ): Promise<Datastore> {
    if (!this.account) {
      throw new Error(`Unable to open datastore. No authenticated user.`);
    }

    // @todo: Should this also call _init to confirm everything is good?
    return new Datastore(schemaUri, this, config);
  }

  /**
   * Open an external datastore owned by an account that isn't the currently connected account.
   *
   * @param schemaUri {string} URI of the schema to open (ie: https://common.schemas.verida.io/health/activity/latest/schema.json)
   * @param did {string} DID of the external account that owns the database
   * @param options {DatabaseOpenConfig} Optional database configuration
   * @returns {Datastore}
   */
  public async openExternalDatastore(
    schemaUri: string,
    did: string,
    options: DatastoreOpenConfig = {}
  ): Promise<Datastore> {

    options = _.merge(
      {
        did,
        external: true,
      },
      options
    );

    // @todo: Should this also call _init to confirm everything is good?
    return new Datastore(schemaUri, this, options);
  }

  public getDbRegistry(): DbRegistry {
    return this.dbRegistry;
  }

  /**
   * Get the status of this context for databases, their connected endpoints and databases
   * 
   * @returns 
   */
  public async info(): Promise<ContextInfo> {
    if (!this.account) {
      throw new Error(`Unable to open database. No authenticated user.`);
    }

    const accountDid = await this.account!.did()
    const engine = await this.getDatabaseEngine(accountDid, false)
    const databases = await engine.info()

    return {
      databases
    }
  }

  public async getAuthContext(authConfig?: AuthTypeConfig, authType?: string): Promise<AuthContext> {
    if (!this.account) {
      throw new Error("No authenticated user");
    }
    const did = await this.account!.did()
    const contextConfig = await this.getContextConfig(did, false)
    if (!authConfig) {
      authConfig = {
        force: false
      }
    }
    
    return this.account!.getAuthContext(this.contextName, contextConfig, authConfig, authType)
  }
  
  /**
   * Emits `progress` event when adding the endpoint has progressed (ie: replicating databases to the new endpoint).
   * 
   * @param engineType 
   * @param endpointUri 
   */
  public async addEndpoint(engineType: ContextEngineType, endpointUri: string) {
    if (!this.account) {
      throw new Error('Unable to add endpoint. No account connected.')
    }

    // For now, only support adding replication to database endpoints
    if (engineType == 'database') {
      const did = await this.account!.did();
      const engine = await this.getDatabaseEngine(did, false)
      const success = await engine.addEndpoint(this, endpointUri)
      if (!success) {
        throw new Error(`Adding endpoint failed with unknown error`)
      }
    }
    else {
      throw new Error(`Adding endpoint for ${engineType} is not supported`)
    }

    // 3. Update DID Document with the new endpoint
      // get the current did document
      // add the endpoint

    // 4. Close any open databases (or re-open them all ignoring the cache?)
    // See this.openDatabase()
  }

  /**
   * Close this context.
   * 
   * Closes all open database connections, returns resources, cancels event listeners
   */
  public async close(options: ContextCloseOptions = {
    clearLocal: false
  }): Promise<void> {
    // close all the other databases
    for (let d in this.databaseCache) {
      const database = await this.databaseCache[d]
      await database.close(<DatabaseCloseOptions> options)
    }
  }

  public async clearDatabaseCache(did: string, databaseName: string) {
    const types = ['internal', 'external']
    for (let t in types) {
      const cacheKey = `${did.toLowerCase()}/${databaseName}/${types[t]}`
      if (this.databaseCache[cacheKey]) {
        delete this.databaseCache[cacheKey]
      }
    }
  }

}

export default Context;
