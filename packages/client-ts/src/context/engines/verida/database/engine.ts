import BaseStorageEngine from "../../base";
import EncryptedDatabase from "./db-encrypted";
import Database from "../../../database";
import { DatabaseOpenConfig } from "../../../interfaces";
import { DatastoreServerClient } from "./client";
import { Account } from "@verida/account";
import PublicDatabase from "./db-public";
import DbRegistry from "../../../db-registry";
import { Interfaces } from "@verida/storage-link";
import { VeridaDatabaseAuthContext, VeridaDatabaseAuthTypeConfig } from "@verida/account"
import BaseDb from "./base-db";
import EndpointReplicator from "./endpoint-replicator";
import Context from '../../../context';
import Endpoint from "./endpoint";

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
      this.endpoints[endpointUri] = new Endpoint(this.storageContext, this.contextConfig, endpointUri)
    }
  }

  public async connectAccount(account: Account) {
    try {
      await super.connectAccount(account);

      // @todo: do we need to authenticate to confirm the context exists?
      /*const authContexts = await account.getAuthContext(this.storageContext, this.contextConfig)
      this.authContexts = <VeridaDatabaseAuthContext[]> authContexts

      for (let i in authContexts) {
        const authContext = this.authContexts[i]
        this.endpoints[<string> authContext.endpointUri].setAuthContext(authContext)
      }*/

      for (let i in this.endpoints) {
        const endpoint = this.endpoints[i]
        await endpoint.connectAccount(account)
      }

      this.accountDid = await this.account!.did();
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

    let endpoints = this.endpoints
    if (!config.isOwner) {
      // Not the owner, so need the dsn and token to have been specified in the config
      if (!config.dsn) {
        throw new Error(`Unable to determine DSN for this user (${did}) and this context (${contextName})`);
      }

      let endpointUris = <string[]> (typeof(config.dsn) == 'object' ? config.dsn : [<string> config.dsn])

      endpoints = {}
      for (let i in endpointUris) {
        const endpointUri = <string> endpointUris[i]
        endpoints[endpointUri] = new Endpoint(this.storageContext, this.contextConfig, endpointUri)

        // connect account to the endpoint if we are connected
        if (this.account) {
          await endpoints[endpointUri].connectAccount(this.account, false)
        }
      }
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
          endpoints,
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
        for (let i in endpoints) {
          await endpoints[i].setUsePublic()
        }

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
        endpoints,
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
          endpoints,
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

}

export default StorageEngineVerida;
