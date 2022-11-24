import { VeridaDatabaseConfig } from "./interfaces";
import BaseDb from "./base-db";
import { DbRegistryEntry } from "../../../db-registry";
import StorageEngineVerida from "./engine"
import EncryptionUtils from "@verida/encryption-utils";
import Utils from "./utils";

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

/**
 * @category
 * Modules
 */
class EncryptedDatabase extends BaseDb {
  protected encryptionKey: Buffer;
  protected password?: string;

  private _sync: any;
  private _localDbEncrypted: any;
  private _localDb: any;

  private _syncError = null;

  /**
   *
   */
  constructor(config: VeridaDatabaseConfig, engine: StorageEngineVerida) {
    super(config, engine);

    this.encryptionKey = config.encryptionKey!;
    this.databaseHash = Utils.buildDatabaseHash(this.databaseName, this.storageContext, this.did)

    // PouchDB sync object
    this._sync = null;
  }

  public async init() {
    if (this.db) {
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

    const databaseName = this.databaseName;

    /* @ts-ignore */
    const instance = this;

    // Do a once off sync to ensure the local database pulls all data from remote server
    // before commencing live syncronisation between the two databases
    await this._localDbEncrypted.replicate
      .from(this.db, {
        // Dont sync design docs
        filter: function (doc: any) {
          return doc._id.indexOf("_design") !== 0;
        },
      })
      .on("error", function (err: any) {
        console.error(
          `Unknown error occurred with replication snapshot from remote database: ${databaseName}`
        );
        console.error(err);
      })
      .on("denied", function (err: any) {
        console.error(
          `Permission denied with replication snapshot from remote database: ${databaseName})`
        );
        console.error(err);
      })
      .on("complete", function (info: any) {
        // Commence two-way, continuous, retrivable sync
        instance.sync();
      });

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
        this._localDb = this._localDbEncrypted = this.db = null;
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

    this._sync = PouchDB.sync(this._localDbEncrypted, this.db, {
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
          `Unknown error occurred syncing with remote database: ${databaseName}`
        );
        console.error(err);
      })
      .on("denied", function (err: any) {
        console.error(
          `Permission denied to sync with remote database: ${databaseName}`
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
    await this.db.close();
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

    for (let i in this.endpoints) {
      await this.endpoints[i].updateDatabase(this.did, this.databaseName, options);
    }

    if (this.config.saveDatabase !== false) {
      await this.engine.getDbRegistry().saveDb(this);
    }
  }

  public async getDb(): Promise<any> {
    await this.init();

    return this._localDb;
  }

  public async getRemoteEncrypted(): Promise<any> {
    await this.init();
    return this.db;
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

    const endpoints = []
    for (let i in this.endpoints) {
      endpoints.push(this.endpoints[i].toString())
    }

    const info = {
      type: "VeridaDatabase",
      privacy: "encrypted",
      did: this.did,
      endpoints: endpoints,
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
