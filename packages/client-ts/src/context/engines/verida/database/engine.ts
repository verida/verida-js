import BaseStorageEngine from "../../base";
import EncryptedDatabase from "./db-encrypted";
import Database from "../../../database";
import { DatabaseOpenConfig, PermissionsConfig } from "../../../interfaces";
import { Account } from "@verida/account";
import PublicDatabase from "./db-public";
import DbRegistry from "../../../db-registry";
import { Interfaces } from "@verida/storage-link";
import EndpointReplicator from "./endpoint-replicator";
import Context from '../../../context';
import Endpoint from "./endpoint";
import { getRandomInt } from "../../../utils";

const _ = require("lodash");

/**
 * @todo
 * 
 * base -> database (new wrapper with same interface, handles sync between endpoints, exposes a single endpoint database) -> endpoints (old database with client and public database suport)
 */

/**
 * @category
 * Modules
 */
class StorageEngineVerida extends BaseStorageEngine {
  private accountDid?: string;
  private endpoints: Record<string, Endpoint>
  private activeEndpoint?: Endpoint

  // @todo: specify device id // deviceId: string="Test device"
  constructor(
    storageContext: string,
    dbRegistry: DbRegistry,
    contextConfig: Interfaces.SecureContextConfig,
  ) {
    super(storageContext, dbRegistry, contextConfig);

    this.endpoints = {}
    for (let i in contextConfig.services.databaseServer.endpointUri) {
      const endpointUri = <string> contextConfig.services.databaseServer.endpointUri[i]
      this.endpoints[endpointUri] = new Endpoint(this, this.storageContext, this.contextConfig, endpointUri)
    }
  }

  private async locateAvailableEndpoint(endpoints: Record<string, Endpoint>): Promise<Endpoint> {
    // Maintain a list of failed endpoints
    const failedEndpoints = []

    if (Object.keys(endpoints).length == 0) {
      throw new Error('No endpoints specified')
    }

    // Randomly choose a "primary" connection
    let primaryIndex = getRandomInt(0, Object.keys(endpoints).length)
    let primaryEndpointUri = Object.keys(endpoints)[primaryIndex]
    //console.log(`primaryEndpointUri: ${primaryEndpointUri} for ${this.storageContext} / ${this.accountDid}`)

    while (failedEndpoints.length < Object.keys(endpoints).length) {
      // Verify the endpoint is active
      try {
        const status = await endpoints[primaryEndpointUri].getStatus()
        if (status.data.status != 'success') {
          throw new Error()
        }

        return endpoints[primaryEndpointUri]
      } catch (err) {
        // endpoint is not available, so set it to fail
        this.emit('endpointUnavailable', primaryEndpointUri)
        failedEndpoints.push(primaryEndpointUri)
        primaryIndex++
        primaryIndex = primaryIndex % Object.keys(endpoints).length
      }
    }

    throw new Error('Unable to locate an available endpoint')
  }

  /**
   * Get an active endpoint
   */
  protected async getActiveEndpoint() {
    if (this.activeEndpoint) {
      return this.activeEndpoint
    }

    this.activeEndpoint = await this.locateAvailableEndpoint(this.endpoints)
    return this.activeEndpoint
  }

  public async connectAccount(account: Account) {
    try {
      await super.connectAccount(account);

      // Authenticate with all endpoints
      // Do async for increased speed
      //const now = (new Date()).getTime()
      const promises = []
      for (let i in this.endpoints) {
        const endpoint = this.endpoints[i]
        promises.push(endpoint.connectAccount(account))
      }

      await Promise.all(promises)

      this.accountDid = await this.account!.did();
      //console.log(`connectAccount(${this.accountDid}): ${(new Date()).getTime()-now}`)

      // call checkReplication() to ensure replication is working correctly on all
      // the endpoints and perform any necessary auto-repair actions
      await this.checkReplication()
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
  ): Promise<Database> {
    const config: DatabaseOpenConfig = _.merge(
      {
        permissions: {
          read: "owner",
          write: "owner",
        },
        did: this.accountDid,
        readOnly: false,
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
      // Not the owner, so need the dsn and token to have been specified in the config
      if (!config.dsn) {
        throw new Error(`Unable to determine DSN for this user (${did}) and this context (${contextName})`);
      }

      let endpointUris = <string[]> (typeof(config.dsn) == 'object' ? config.dsn : [<string> config.dsn])

      const endpoints: Record<string, Endpoint> = {}
      for (let i in endpointUris) {
        const endpointUri = <string> endpointUris[i]
        endpoints[endpointUri] = new Endpoint(this, this.storageContext, this.contextConfig, endpointUri)

        // connect account to the endpoint if we are connected
        // @todo: make async for all endpoints
        if (this.account) {
          await endpoints[endpointUri].connectAccount(this.account, false)
          // No need for await as this can occur in the background
          endpoints[endpointUri].checkReplication(databaseName)
        }
      }

      endpoint = await this.locateAvailableEndpoint(endpoints)
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
          signContext: options.signingContext!,
          permissions: config.permissions,
          readOnly: config.readOnly,
          encryptionKey,
          endpoint,
          isOwner: config.isOwner,
          saveDatabase: config.saveDatabase,
        },
        this
      );

      await db.init();
      return db;
    } else if (config.permissions!.read == "public") {
      // If we aren't the owner of this database use the public credentials
      // to access this database
      if (!config.isOwner) {
        await endpoint.setUsePublic()

        if (config.permissions!.write != "public") {
          config.readOnly = true;
        }
      }

      const db = new PublicDatabase({
        databaseName,
        did,
        storageContext: contextName,
        signContext: options.signingContext!,
        permissions: config.permissions,
        readOnly: config.readOnly,
        endpoint,
        isOwner: config.isOwner,
        saveDatabase: config.saveDatabase,
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
          signContext: options.signingContext!,
          permissions: config.permissions,
          readOnly: config.readOnly,
          encryptionKey,
          endpoint,
          isOwner: config.isOwner,
          saveDatabase: config.saveDatabase,
        },
        this
      );

      try {
        await db.init();
      } catch (err: any) {
        if (err.status == 401 && err.code == 90) {
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

    // @todo Cache databases so we don't open the same one more than once
    //let db = new Database(dbName, did, this.appName, this, config);

    /*if (config.saveDatabase && db._originalDb && this.dbManager) {
            this.dbManager.saveDb(dbName, did, this.appName, config.permissions, db._originalDb.encryptionKey);
        }*/
  }

  public logout() {
    super.logout();
    
    for (let i in this.endpoints) {
      this.endpoints[i].logout()
    }
  }

  public async addEndpoint(context: Context, endpointUri: string): Promise<boolean> {
    return await EndpointReplicator.replicate(this, context, endpointUri)
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
  public async createDb(databaseName: string, did: string, permissions: PermissionsConfig) {
    //const now = (new Date()).getTime()
    const promises = []
    for (let i in this.endpoints) {
      const endpoint = this.endpoints[i]
      promises.push(endpoint.createDb(databaseName, did, permissions))
    }

    // No need for await as this can occur in the background
    await Promise.all(promises)
    //console.log(`createDb(${databaseName}, ${did}): ${(new Date()).getTime()-now}`)
    this.checkReplication(databaseName)
  }

}

export default StorageEngineVerida;
