import { VeridaDatabaseConfig } from "./interfaces";
import BaseDb from "./base-db";
import DbRegistry, { DbRegistryEntry } from "../../../db-registry";
import EncryptionUtils from "@verida/encryption-utils";

import * as PouchDBCryptLib from "pouchdb";
import * as PouchDBLib from "pouchdb";

// See https://github.com/pouchdb/pouchdb/issues/6862
const { default: PouchDBCrypt } = PouchDBCryptLib as any;
const { default: PouchDB } = PouchDBLib as any;

import * as PouchDBFindLib from "pouchdb-find";
const { default: PouchDBFind } = PouchDBFindLib as any;

import * as CryptoPouch from "crypto-pouch";

PouchDBCrypt.plugin(PouchDBFind);
PouchDB.plugin(PouchDBFind);
PouchDBCrypt.plugin(CryptoPouch);

//db = new EncryptedDatabase(databaseName, did, this.dsn!, encryptionKey, config.permissions)

/**
 * @category
 * Modules
 */
class EncryptedDatabase extends BaseDb {
  protected encryptionKey: Buffer;
  protected password?: string;

  private dbRegistry: DbRegistry;
  private _sync: any;
  private _localDbEncrypted: any;
  private _localDb: any;
  private _remoteDbEncrypted: any;

  private _syncError = null;

  /**
   *
   * @param {*} dbName
   * @param {*} dataserver
   * @param {string} encryptionKey Uint8Array(32) representing encryption key
   * @param {*} remoteDsn
   * @param {*} did
   * @param {*} permissions
   */
  //constructor(dbHumanName: string, dbName: string, dataserver: any, encryptionKey: string | Buffer, remoteDsn: string, did: string, permissions: PermissionsConfig) {
  constructor(config: VeridaDatabaseConfig, dbRegistry: DbRegistry) {
    super(config);

    this.dbRegistry = dbRegistry;
    this.encryptionKey = config.encryptionKey!;

    // PouchDB sync object
    this._sync = null;
  }

  public async init() {
    if (this._localDb) {
      return;
    }

    await super.init();

    this._localDbEncrypted = new PouchDB(this.databaseHash);
    this._localDb = new PouchDBCrypt(this.databaseHash);

    // Generate an encryption password from the encryption key
    const password = (this.password = Buffer.from(this.encryptionKey).toString(
      "hex"
    ));

    // Generate a deterministic salt from the password and database hash
    const saltString = EncryptionUtils.hash(`${password}/${this.databaseHash}`);
    const salt = Buffer.from(saltString, "hex");

    await this._localDb.crypto({
      password,
      salt,
      iterations: 1000,
      // Setting to 1,000 -- Any higher and it takes too long on mobile devices
    });

    this._remoteDbEncrypted = new PouchDB(this.dsn + this.databaseHash, {
      skip_setup: true,
    });

    let info;
    try {
      info = await this._remoteDbEncrypted.info();

      if (info.error && info.error == "not_found") {
        // Remote dabase wasn't found, so attempt to create it
        await this.createDb();
      }
    } catch (err: any) {
      if (err.error && err.error == "not_found") {
        // Remote database wasn't found, so attempt to create it
        await this.createDb();
      }

      throw err;
    }

    if (info && info.error == "forbidden") {
      throw new Error(`Permission denied to access remote database.`);
    }

    const databaseName = this.databaseName;
    const dsn = this.dsn;
    const instance = this;

    // Do a once off sync to ensure the local database pulls all data from remote server
    // before commencing live syncronisation between the two databases
    await this._localDbEncrypted.replicate
      .from(this._remoteDbEncrypted, {
        // Dont sync design docs
        filter: function (doc: any) {
          return doc._id.indexOf("_design") !== 0;
        },
      })
      .on("error", function (err: any) {
        console.error(
          `Unknown error occurred with replication snapshot from remote database: ${databaseName} (${dsn})`
        );
        console.error(err);
      })
      .on("denied", function (err: any) {
        console.error(
          `Permission denied with replication snapshot from remote database: ${databaseName} (${dsn})`
        );
        console.error(err);
      })
      .on("complete", function (info: any) {
        // Commence two-way, continuous, retrivable sync
        instance.sync();
      });

    this.db = this._localDb;

    /**
     * We attempt to fetch some rows from the database.
     *
     * If there is data in this database, it ensures the current encryption key
     * can decrypt the data.
     */
    try {
      await this.getMany();
    } catch (err: any) {
      // This error message is thrown by the underlying decrypt library if the
      // data can't be decrypted
      if (
        err.message == `Unsupported state or unable to authenticate data` ||
        err.message == "Could not decrypt!"
      ) {
        // Clear the instantiated PouchDb instances and throw a more useful exception
        this._localDb = this._localDbEncrypted = this._remoteDbEncrypted = null;
        throw new Error(`Invalid encryption key supplied`);
      }

      // Unknown error, rethrow
      throw err;
    }
  }

  /**
   * Restarts the remote database syncing
   *
   * This will clear all sync event listeners.
   * It will retain event listeners on the actual database (subscribed via `changes()`)
   *
   * @returns PouchDB Sync object
   */
  public sync() {
    if (this._sync) {
      // Cancel any existing sync
      this._sync.cancel();
    }

    const instance = this;
    const databaseName = this.databaseName;
    const dsn = this.dsn;

    this._sync = PouchDB.sync(this._localDbEncrypted, this._remoteDbEncrypted, {
      live: true,
      retry: true,
      // Dont sync design docs
      filter: function (doc: any) {
        return doc._id.indexOf("_design") !== 0;
      },
    })
      .on("error", function (err: any) {
        instance._syncError = err;
        console.error(
          `Unknown error occurred syncing with remote database: ${databaseName} (${dsn})`
        );
        console.error(err);
      })
      .on("denied", function (err: any) {
        console.error(
          `Permission denied to sync with remote database: ${databaseName} (${dsn})`
        );
        console.error(err);
      });

    return this._sync;
  }

  /**
   * Subscribe to sync events
   *
   * See https://pouchdb.com/api.html#sync
   *
   * ie:
   *
   * ```
   * const listener = database.onSync('error', (err) => { console.log(err) })
   * listener.cancel()
   * ```
   *
   * @param event
   * @param handler
   */
  public onSync(event: string, handler: Function) {
    if (!this._sync) {
      throw new Error(
        "Unable to create sync event handler. Syncronization is not enabled."
      );
    }

    return this._sync.on(event, handler);
  }

  /**
   * Close a database.
   *
   * This will remove all event listeners.
   */
  public async close() {
    this._sync.cancel();
    await this._localDbEncrypted.close();
    await this._remoteDbEncrypted.close();
    this._sync = null;
    this._syncError = null;
  }

  public async updateUsers(
    readList: string[] = [],
    writeList: string[] = []
  ): Promise<void> {
    await this.init();

    this.permissions!.readList = readList;
    this.permissions!.writeList = writeList;

    const options = {
      permissions: this.permissions,
    };

    try {
      this.client.updateDatabase(this.did, this.databaseHash, options);

      if (this.config.saveDatabase !== false) {
        await this.dbRegistry.saveDb(this);
      }
    } catch (err: any) {
      throw new Error("User doesn't exist or unable to create user database");
    }
  }

  public async getDb(): Promise<any> {
    await this.init();

    return this._localDb;
  }

  public async getRemoteEncrypted(): Promise<any> {
    await this.init();
    return this._remoteDbEncrypted;
  }

  public async getLocalEncrypted(): Promise<any> {
    await this.init();
    return this._localDbEncrypted;
  }

  public getEncryptionKey(): Uint8Array {
    return this.encryptionKey!;
  }

  public async info(): Promise<any> {
    await this.init();

    const sync: any = {};
    if (this._sync) {
      sync.canceled = this._sync.canceled;
      sync.pull = {
        status: this._sync.pull.state,
        canceled: this._sync.pull.canceled,
      };
      sync.push = {
        status: this._sync.push.state,
        canceled: this._sync.push.canceled,
      };
    }

    const info = {
      type: "VeridaDatabase",
      privacy: "encrypted",
      did: this.did,
      dsn: this.dsn,
      permissions: this.permissions!,
      storageContext: this.storageContext,
      databaseName: this.databaseName,
      databaseHash: this.databaseHash,
      encryptionKey: this.encryptionKey!,
      sync,
    };

    return info;
  }

  public async registryEntry(): Promise<DbRegistryEntry> {
    await this.init();

    return {
      dbHash: this.databaseHash,
      dbName: this.databaseName,
      endpointType: "VeridaDatabase",
      did: this.did,
      contextName: this.storageContext,
      permissions: this.permissions!,
      encryptionKey: {
        type: "x25519-xsalsa20-poly1305",
        key: this.password!,
      },
    };
  }
}

export default EncryptedDatabase;
