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

const _ = require("lodash");

/**
 * @category
 * Modules
 */
class StorageEngineVerida extends BaseStorageEngine {
  private client: DatastoreServerClient;

  private publicCredentials: any; // @todo fix typing
  private accountDid?: string;
  private auth?: VeridaDatabaseAuthContext

  // @todo: specify device id // deviceId: string="Test device"
  constructor(
    storageContext: string,
    dbRegistry: DbRegistry,
    contextConfig: Interfaces.SecureContextConfig,
  ) {
    super(storageContext, dbRegistry, contextConfig);
    this.client = new DatastoreServerClient(
      this.storageContext,
      contextConfig.services.databaseServer.endpointUri
    );
  }

  public async connectAccount(account: Account) {
    try {
      await super.connectAccount(account);

      const auth = await account.getAuthContext(this.storageContext, this.contextConfig)
      this.auth = <VeridaDatabaseAuthContext> auth
      await this.client.setAuthContext(this.auth)

      this.accountDid = await this.account!.did();
    } catch (err: any) {
      if (err.name == "ContextNotFoundError") {
        return
      }

      throw err
    }
  }

  /**
   * When connecting to a CouchDB server for an external user, the current user may not
   * have access to read/write.
   *
   * Take the external user's `endpointUri` that points to their CouchDB server. Establish
   * a connection to the Verida Middleware (DatastoreServerClient) as the current user
   * (accountDid) and create a new account if required.
   *
   * Return the current user's DSN which provides authenticated access to the external
   * user's CouchDB server for the current user.
   *
   * @param endpointUri
   * @param did
   * @returns {string}
   */
  protected async buildExternalAuth(endpointUri: string): Promise<VeridaDatabaseAuthContext> {
    if (!this.account) {
      throw new Error('Unable to connect to external storage node. No account connected.')
    }

    const auth = await this.account!.getAuthContext(this.storageContext, this.contextConfig, <VeridaDatabaseAuthTypeConfig> {
      endpointUri
    })

    return <VeridaDatabaseAuthContext> auth

    /*const client = new DatastoreServerClient(this.storageContext, this.contextConfig);
    await client.setAccount(this.account!);

    const auth = await client.getContextAuth();
    return auth*/
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

    const instance = this

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

    let dsn = config.isOwner ? this.auth!.host! : config.dsn!;
    if (!dsn) {
      throw new Error(`Unable to determine DSN for this user (${did}) and this context (${contextName})`);
    }

    let token = config.isOwner ? this.auth!.accessToken : config.token!;
    if (!dsn) {
      throw new Error(`Unable to determine DSN for this user (${did}) and this context (${contextName})`);
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
          dsn,
          token,
          permissions: config.permissions,
          readOnly: config.readOnly,
          encryptionKey,
          client: this.client,
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
        const publicCreds = await this.getPublicCredentials();
        dsn = publicCreds.dsn;

        if (config.permissions!.write != "public") {
          config.readOnly = true;
        }
      }

      const db = new PublicDatabase({
        databaseName,
        did,
        dsn,
        token,
        storageContext: contextName,
        signContext: options.signingContext!,
        permissions: config.permissions,
        readOnly: config.readOnly,
        client: this.client,
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

      /**
       * We could be connecting to:
       * - A database we own
       *  - Need to connect using our dsn (this.dsn)
       * - An database owned by another user
       *  - Need to connect to the user's database server
       *  - Need to authenticate as ourselves
       *  - Need to talk to the db hash for the did that owns the database
       */

      if (!config.isOwner && this.account) {
        // need to build a complete dsn
        const auth = await this.buildExternalAuth(config.dsn!);
        dsn = auth.host;
        token = auth.accessToken;
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
          dsn,
          token,
          permissions: config.permissions,
          readOnly: config.readOnly,
          encryptionKey,
          client: this.client,
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


  /**
   * Re-authenticate this storage engine and update the credentials
   * for the database.
   */
  public async reAuth(db: BaseDb) {
    if (!this.account) {
      // No account connected, so can't reconnect database
      const info = await db.info()
      throw new Error(`No account connected. Access token expired, but unable to regenerate for database ${info.databaseName}`)
    }

    const auth = await this.account!.getAuthContext(this.storageContext, this.contextConfig, <VeridaDatabaseAuthTypeConfig> {
      invalidAccessToken: true
    })
    this.auth = <VeridaDatabaseAuthContext> auth
    await this.client.setAuthContext(this.auth)
    await db.setAccessToken(this.auth!.accessToken!)
  }

  public logout() {
    super.logout();
    this.client = new DatastoreServerClient(
      this.storageContext,
      this.contextConfig.services.databaseServer.endpointUri
    );
  }

  private async getPublicCredentials() {
    if (this.publicCredentials) {
      return this.publicCredentials;
    }

    const response = await this.client.getPublicUser();
    this.publicCredentials = response.data.user;
    return this.publicCredentials;
  }
}

export default StorageEngineVerida;
