import BaseStorageEngine from "../../base";
import EncryptedDatabase from "./db-encrypted";
import { Account } from "@verida/account";
import PublicDatabase from "./db-public";
import DbRegistry from "../../../db-registry";
import Context from '../../../context';
import Endpoint from "./endpoint";
import { ContextDatabaseInfo, DatabaseOpenConfig, DatabaseDeleteConfig, DatabasePermissionsConfig, IDatabase, SecureContextConfig } from "@verida/types";

const _ = require("lodash");

/**
 * @todo
 * 
 * base -> database (new wrapper with same interface, handles sync between endpoints, exposes a single endpoint database) -> endpoints (old database with client and public database suport)
 */

/**
 * @emits EndpointUnavailable
 * @emits EndpointWarning
 */
class StorageEngineVerida extends BaseStorageEngine {
  private accountDid?: string;
  private endpoints: Record<string, Endpoint>
  private activeEndpoint?: Endpoint

  // @todo: specify device id // deviceId: string="Test device"
  constructor(
    context: Context,
    dbRegistry: DbRegistry,
    contextConfig: SecureContextConfig,
  ) {
    super(context, dbRegistry, contextConfig);

    const engine = this
    this.endpoints = {}
    for (let i in contextConfig.services.databaseServer.endpointUri) {
      const endpointUri = <string> contextConfig.services.databaseServer.endpointUri[i]
      this.endpoints[endpointUri] = new Endpoint(this, this.storageContext, this.contextConfig, endpointUri)

      // Catch and re-throw endpoint warnings
      this.endpoints[endpointUri].on('EndpointWarning', (message) => {
        engine.emit('EndpointWarning', endpointUri, message)
      })
    }
  }

  public async locateAvailableEndpoint(endpoints: Record<string, Endpoint>, checkStatus = true): Promise<Endpoint> {
    // Maintain a list of failed endpoints
    const failedEndpoints = []

    const endpointCount = Object.keys(endpoints).length

    if (endpointCount == 0) {
      throw new Error('No endpoints specified')
    }

    // Choose a "primary" connection in such a way that it remains the
    // same for a 1 hour block. This ensures a user won't open lots
    // of connections to different nodes which minimizes the replication
    // required between the user's nodes, but still spreads the load across
    // all nodes across a given 24 hour period
    let primaryIndex = Math.trunc((new Date()).getTime()/1000/60/60) % endpointCount
    let primaryEndpointUri = Object.keys(endpoints)[primaryIndex]

    if (!checkStatus) {
      return endpoints[primaryEndpointUri]
    }

    while (failedEndpoints.length < Object.keys(endpoints).length) {
      // Verify the endpoint is active
      try {
        const status = await endpoints[primaryEndpointUri].getStatus()
        if (status.data.status != 'success') {
          throw new Error('Storage node is not available')
        }

        return endpoints[primaryEndpointUri]
      } catch (err) {
        // endpoint is not available, so set it to fail
        this.emit('EndpointUnavailable', primaryEndpointUri)
        failedEndpoints.push(primaryEndpointUri)
        primaryIndex++
        primaryIndex = primaryIndex % Object.keys(endpoints).length
        primaryEndpointUri = Object.keys(endpoints)[primaryIndex]
      }
    }

    throw new Error('Unable to locate an available endpoint')
  }

  /**
   * Get an active endpoint
   */
  public async getActiveEndpoint(checkStatus: boolean = true, clearActive: boolean = false) {
    if (clearActive) {
      this.activeEndpoint = undefined
    }

    if (this.activeEndpoint) {
      return this.activeEndpoint
    }

    this.activeEndpoint = await this.locateAvailableEndpoint(this.endpoints, checkStatus)
    return this.activeEndpoint
  }

  public getEndpoint(endpintUri: string): Endpoint {
    return this.endpoints[endpintUri]
  }

  public getEndpoints(): Record<string, Endpoint> {
    return this.endpoints
  }

  public async connectAccount(account: Account) {
    try {
      await super.connectAccount(account);

      // Authenticate with all endpoints owned by this user in this context
      // Do async for increased speed
      //const now = (new Date()).getTime()
      const promises = []
      for (let i in this.endpoints) {
        const endpoint = this.endpoints[i]
        promises.push(endpoint.connectAccount(account))
      }

      const results = await Promise.allSettled(promises)

      const finalEndpoints: Record<string, Endpoint> = {}
      let resultIndex = 0
      for (let i in this.endpoints) {
        const endpoint = this.endpoints[i]
        const result = results[resultIndex++]

        if (result.status == 'fulfilled') {
          finalEndpoints[i] = endpoint
        } else {
          this.emit('EndpointUnavailable', i)
        }
      }

      this.endpoints = finalEndpoints
      // Select an active endpoint. No need to check status as invalid endpoints already removed above.
      this.activeEndpoint = await this.getActiveEndpoint(false)
      this.accountDid = (await this.account!.did()).toLowerCase();
      //console.log(`connectAccount(${this.accountDid}): ${(new Date()).getTime()-now}`)

      // call checkReplication() to ensure replication is working correctly on all
      // the endpoints and perform any necessary auto-repair actions
      // no need to async?
      this.checkReplication()
    } catch (err: any) {
      if (err.name == "ContextNotFoundError") {
        return
      }

      throw err
    }
  }

  /**
   * Open a database either that may or may not be owned by this usesr
   *
   * @param databaseName
   * @param options
   * @returns {Database}
   */
  public async openDatabase(
    databaseName: string,
    options: DatabaseOpenConfig
  ): Promise<IDatabase> {
    const config: DatabaseOpenConfig = _.merge(
      {
        permissions: {
          read: "owner",
          write: "owner",
        },
        did: this.accountDid,
        readOnly: false,
        verifyEncryptionKey: true
      },
      options
    );

    const contextName = config.contextName ? config.contextName : this.storageContext

    // Default to user's account did if not specified
    if (typeof(config.isOwner) == 'undefined') {
      config.isOwner = config.did == this.accountDid;
    }

    config.saveDatabase = config.isOwner; // always save this database to registry if user is the owner
    let did = config.did!.toLowerCase();

    // If permissions require "owner" access, connect the current user
    if (
      (config.permissions!.read == "owner" ||
        config.permissions!.write == "owner") &&
      !config.readOnly
    ) {
      if (!config.readOnly && !this.keyring) {
        throw new Error(
          `Unable to open database. Permissions require "owner" access, but no account connected.`
        );
      }

      if (!config.readOnly && config.isOwner && !this.keyring) {
        throw new Error(
          `Unable to open database. Permissions require "owner" access, but account is not owner.`
        );
      }

      if (
        !config.readOnly &&
        !config.isOwner &&
        config.permissions!.read == "owner"
      ) {
        throw new Error(
          `Unable to open database. Permissions require "owner" access to read, but account is not owner.`
        );
      }
    }

    let endpoint: Endpoint
    if (!config.isOwner) {
      // Not the owner, so need the endpoints to have been specified in the config
      if (!config.endpoints) {
        throw new Error(`Unable to determine endpoints for this user (${did}) and this context (${contextName})`);
      }

      let endpointUris = <string[]> (typeof(config.endpoints) == 'object' ? config.endpoints : [<string> config.endpoints])

      const endpoints: Record<string, Endpoint> = {}
      for (let i in endpointUris) {
        const endpointUri = <string> endpointUris[i]
        const endpoint = new Endpoint(this, this.storageContext, this.contextConfig, endpointUri)

        if (config.permissions!.read == "public") {
          // connect account using a public endpoint
          await endpoint.setUsePublic()
          endpoints[endpointUri] = endpoint
        }
        else if (this.account) {
          // connect account to the endpoint if we are connected
          // @todo: make async for all endpoints
          try {
            await endpoint.connectAccount(this.account, false)
            endpoints[endpointUri] = endpoint

            // No need for await as this can occur in the background
            //endpoint.checkReplication(databaseName)
          } catch (err: any) {
            if (err.message.match('Unable to connect')) {
              // storage node is unavailable, so ignore
            } else {
              throw err
            }
          }
        } else {
          // Unknown if this endpoint is valid, so include it in the pool and the status
          // will be checked
          endpoints[endpointUri] = endpoint
        }
      }

      // If we have an account we would have already attempted to connect to the storage node
      // and removed it if it was unavailable, so don't need to check the endpoint status
      endpoint = await this.locateAvailableEndpoint(endpoints, this.account ? true : false)
    } else {
      endpoint = await this.getActiveEndpoint()
    }

    // force read only access if the current user doesn't have write access
    if (!config.isOwner) {
      if (config.permissions!.write == "owner") {
        // Only the owner can write, so set to read only
        config.readOnly = true;
      } else if (
        config.permissions!.write == "users" &&
        config.permissions!.writeList &&
        config.permissions!.writeList!.indexOf(config.did!) == -1
      ) {
        // This user doesn't have explicit write access
        config.readOnly = true;
      }
    }

    if (
      config.permissions!.read == "owner" &&
      config.permissions!.write == "owner"
    ) {
      if (!this.keyring) {
        throw new Error(
          `Unable to open database. Permissions require "owner" access, but no account connected.`
        );
      }

      const storageContextKey = await this.keyring!.getStorageContextKey(
        databaseName
      );
      const encryptionKey = storageContextKey.secretKey;
      const db = new EncryptedDatabase(
        {
          databaseName,
          did,
          storageContext: contextName,
          signContext: config.signingContext!,
          permissions: config.permissions,
          readOnly: config.readOnly,
          encryptionKey,
          endpoint,
          isOwner: config.isOwner,
          saveDatabase: config.saveDatabase,
          verifyEncryptionKey: config.verifyEncryptionKey,
          plugins: config.plugins ? config.plugins : []
        },
        this
      );

      await db.init();
      return db;
    } else if (config.permissions!.read == "public") {
      // If we aren't the owner of this database use the public credentials
      // to access this database
      if (!config.isOwner) {
        if (config.permissions!.write != "public") {
          config.readOnly = true;
        }
      }

      const db = new PublicDatabase({
        databaseName,
        did,
        storageContext: contextName,
        signContext: config.signingContext!,
        permissions: config.permissions,
        readOnly: config.readOnly,
        endpoint,
        isOwner: config.isOwner,
        saveDatabase: config.saveDatabase,
        plugins: config.plugins ? config.plugins : []
      }, this);

      await db.init();
      return db;
    } else if (
      config.permissions!.read == "users" ||
      config.permissions!.write == "users"
    ) {
      if (config.isOwner && !this.keyring) {
        throw new Error(
          `Unable to open database as the owner. No account connected.`
        );
      }

      if (!config.isOwner && !config.encryptionKey) {
        throw new Error(
          `Unable to open external database. No encryption key in config.`
        );
      }

      const storageContextKey = await this.keyring!.getStorageContextKey(
        databaseName
      );
      const encryptionKey = config.encryptionKey
        ? config.encryptionKey
        : storageContextKey.secretKey;

      const db = new EncryptedDatabase(
        {
          databaseName,
          did,
          storageContext: contextName,
          signContext: config.signingContext!,
          permissions: config.permissions,
          readOnly: config.readOnly,
          encryptionKey,
          endpoint,
          isOwner: config.isOwner,
          saveDatabase: config.saveDatabase,
          verifyEncryptionKey: config.verifyEncryptionKey,
          plugins: config.plugins ? config.plugins : []
        },
        this
      );

      try {
        await db.init();
      } catch (err: any) {
        if ((err.status == 401 && err.code == 90) || err.message.match('Permission denied')) {
          throw new Error(
            `Unable to open database. Invalid credentials supplied.`
          );
        }

        throw err;
      }

      return db;
    } else {
      throw new Error(
        "Unable to open database. Invalid permissions configuration."
      );
    }
  }

  public logout() {
    super.logout();
    
    for (let i in this.endpoints) {
      this.endpoints[i].logout()
    }
  }

  /**
   * Call checkReplication() on all the endpoints
   */
  public async checkReplication(databaseName?: string) {
    //const now = (new Date()).getTime()
    const promises = []
    for (let i in this.endpoints) {
      const endpoint = this.endpoints[i]
      promises.push(endpoint.checkReplication(databaseName))
    }

    // No need for await as this can occur in the background
    await Promise.all(promises)
    //console.log(`checkReplication(${databaseName}): ${(new Date()).getTime()-now}`)
  }

  /**
   * Call createDb() on all the endpoints
   */
  public async createDb(databaseName: string, did: string, permissions: DatabasePermissionsConfig) {
    //const now = (new Date()).getTime()
    const promises = []
    for (let i in this.endpoints) {
      const endpoint = this.endpoints[i]
      const retry = (typeof(this.accountDid) !== 'undefined' && did.toLowerCase() == this.accountDid!.toLowerCase())
      promises.push(endpoint.createDb(databaseName, permissions, retry))
    }

    // A node may be down, so quietly ignore that
    // If all nodes are down, throw an error as they database won't have been created
    const results = await Promise.allSettled(promises)
    let resultIndex = 0
    let failureCount = 0
    for (let i in this.endpoints) {
      const endpoint = this.endpoints[i]
      const result = results[resultIndex++]

      if (result.status !== 'fulfilled') {
        failureCount++
      }
    }

    if (failureCount == Object.keys(this.endpoints).length) {
      throw new Error(`Unable to create database (${databaseName}) on remote nodes`)
    }

    // Call check replication to ensure this new database gets replicated across all nodes
    await this.checkReplication(databaseName)
  }

  /**
   * Call updateDb() on all the endpoints
   */
  public async updateDatabase(databaseName: string, options: any): Promise<void> {
    //const now = (new Date()).getTime()
    const promises = []
    for (let i in this.endpoints) {
      const endpoint = this.endpoints[i]
      promises.push(endpoint.updateDatabase(databaseName, options))
    }

    // A node may be down, so quietly ignore that
    // If all nodes are down, throw an error as they database won't have been updated
    const results = await Promise.allSettled(promises)
    let resultIndex = 0
    let failureCount = 0
    for (let i in this.endpoints) {
      const endpoint = this.endpoints[i]
      const result = results[resultIndex++]

      if (result.status !== 'fulfilled') {
        failureCount++
      }
    }

    if (failureCount == Object.keys(this.endpoints).length) {
      throw new Error(`Unable to update database (${databaseName}) on remote nodes`)
    }
  }

  /**
   * Call deleteDatabase() on all the endpoints
   */
  public async deleteDatabase(databaseName: string, config?: DatabaseDeleteConfig): Promise<void> {
    await this.closeDatabase(this.accountDid!, databaseName)

    //const now = (new Date()).getTime()
    const promises = []
    for (let i in this.endpoints) {
      const endpoint = this.endpoints[i]
      promises.push(endpoint.deleteDatabase(databaseName))
    }

    // Check the status of the storage node delete requests
    // A node may be down, so quietly ignore that
    // If all nodes are down, throw an error as they database won't have been deleted
    const results = await Promise.allSettled(promises)
    let resultIndex = 0
    let failureCount = 0
    for (let i in this.endpoints) {
      const endpoint = this.endpoints[i]
      const result = results[resultIndex++]

      if (result.status !== 'fulfilled') {
        failureCount++
      }
    }

    if (failureCount == Object.keys(this.endpoints).length) {
      throw new Error(`Unable to delete database (${databaseName}) on remote nodes`)
    }

    // delete from database registry
    const dbRegistry = this.context.getDbRegistry()
    await dbRegistry.removeDb(databaseName, this.accountDid!, this.storageContext)
    //console.log(`createDb(${databaseName}, ${did}): ${(new Date()).getTime()-now}`)
  }

  public async info(): Promise<ContextDatabaseInfo> {
    const endpoints: any = {}
    let databases: any = {}

    for (let e in this.endpoints) {
      const endpoint = this.endpoints[e]
      const usage = await endpoint.getUsage(false)

      endpoints[endpoint.toString()] = {
        endpointUri: endpoint.toString(),
        usage
      }

      if (Object.keys(databases).length == 0) {
        databases = await endpoint.getDatabases(false)
      }
    }

    const keys = await this.keyring!.getKeys()

    return {
      name: this.storageContext,
      activeEndpoint: this.activeEndpoint?.toString(),
      endpoints,
      databases,
      keys
    }
  }

  public async closeDatabase(did: string, databaseName: string) {
    // delete from cache
    await this.context.clearDatabaseCache(did, databaseName)

    for (let e in this.endpoints) {
      this.endpoints[e].disconnectDatabase(did, databaseName)
    }
  }
}

export default StorageEngineVerida;
