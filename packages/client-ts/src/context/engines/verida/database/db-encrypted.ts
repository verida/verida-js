import { VeridaDatabaseConfig } from "./interfaces";
import BaseDb from "./base-db";
import StorageEngineVerida from "./engine"
import EncryptionUtils from "@verida/encryption-utils";

import * as PouchDBCryptLib from "pouchdb";
import * as PouchDBLib from "pouchdb";

// See https://github.com/pouchdb/pouchdb/issues/6862
const { default: PouchDBCrypt } = PouchDBCryptLib as any;
const { default: PouchDB } = PouchDBLib as any;

import * as PouchDBFindLib from "pouchdb-find";
const { default: PouchDBFind } = PouchDBFindLib as any;

import * as CryptoPouch from "crypto-pouch";
import { DatabaseCloseOptions, DatabaseDeleteConfig, DbRegistryEntry } from "@verida/types";

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
  private _syncStatus?: string;
  private _localDbEncrypted: any;
  private _localDb: any;

  private _syncError = null;

  /**
   *
   */
  constructor(config: VeridaDatabaseConfig, engine: StorageEngineVerida) {
    super(config, engine);

    this.encryptionKey = config.encryptionKey!;

    // PouchDB sync object
    this._sync = null;
  }

  public async init() {
    if (this.db) {
      return;
    }

    const now = (new Date()).getTime()
    await super.init();
    //console.log(`Db.init-1(${this.databaseName}): ${(new Date()).getTime()-now}`)

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
    //console.log(`Db.init-2(${databaseName}): ${(new Date()).getTime()-now}`)

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
        //console.log(`Db.init-3(${databaseName}): ${(new Date()).getTime()-now}`)
        // Commence two-way, continuous, retrivable sync
        instance.sync();
        //console.log(`Db.init-4(${databaseName}): ${(new Date()).getTime()-now}`)
      });

    /**
     * We attempt to fetch some rows from the database.
     *
     * If there is data in this database, it ensures the current encryption key
     * can decrypt the data.
     */
    try {
      await this.getMany();
      //console.log(`Db.init-5(${databaseName}): ${(new Date()).getTime()-now}`)
    } catch (err: any) {
      // This error message is thrown by the underlying decrypt library if the
      // data can't be decrypted
      if (
        err.message == `Unsupported state or unable to authenticate data` ||
        err.message == "Could not decrypt!"
      ) {
        // Clear the instantiated PouchDb instances and throw a more useful exception
        await this.close()
        throw new Error(`Invalid encryption key supplied`);
      }

      // Unknown error, rethrow
      throw err;
    }

    //console.log(`Db.init-Final(${databaseName}): ${(new Date()).getTime()-now}`)
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
      .on("change", function (info: any) {
        instance._syncStatus = 'change'
        instance._syncInfo = info
      })
      .on("paused", function (err: any) {
        instance._syncStatus = 'paused'
        instance._syncInfo = err
      })
      .on("active", function () {
        instance._syncStatus = 'active'
        instance._syncInfo = undefined
      })
      .on("complete", function (info: any) {
        instance._syncStatus = 'complete'
        instance._syncInfo = info
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
  public async close(options: DatabaseCloseOptions = {
    clearLocal: false
  }) {
    if (options.clearLocal) {
      await this.destroy({
        localOnly: true
      })

      return
    }

    if (this._sync) {
      this._sync.cancel();
    }

    try {
      await this._localDbEncrypted.close();
    } catch (err) {
      // may already be closed
    }
    
    try {
      await this.db.close();
    } catch (err) {
      // may already be closed
    }

    this._sync = null;
    this._syncError = null;
    await this.engine.closeDatabase(this.did, this.databaseName)
    this.emit('closed', this.databaseName)
  }

  public async destroy(options: DatabaseDeleteConfig = {
    localOnly: false
  }): Promise<void> {
    // Need to ensure any database sync to remote server has completed
    if (this._sync && this._syncStatus != 'paused' && this._syncStatus != 'complete') {
      const instance = this
      // Create a promise that resolves when the sync status returns to `paused`
      const promise: Promise<void> = new Promise((resolve) => {
        instance._sync.on('paused', async () => {
          resolve()
        })
        instance._sync.on('complete', async () => {
          resolve()
        })
      })
      
      // Wait until sync completes
      await promise
    }

    // Actually perform database deletion
    await this._destroy(options)
  }

  private async _destroy(options: DatabaseDeleteConfig = {
    localOnly: false
  }): Promise<void> {
    try {
      // Destory the local pouch database (this deletes this._local and this._localDbEncrypted as they share the same underlying data source)
      await this._localDbEncrypted.destroy()

      if (!options.localOnly) {
        // Only delete remote database if required
        await this.engine.deleteDatabase(this.databaseName)
      }
     
      await this.close({
        clearLocal: false
      })
    } catch (err) {
      console.error(err)
    }
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

    await this.engine.updateDatabase(this.databaseName, options);

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

    const info = {
      type: "VeridaDatabase",
      privacy: "encrypted",
      did: this.did,
      endpoint: this.endpoint.toString(),
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
      endpoint: this.endpoint.toString()
    };
  }
}

export default EncryptedDatabase;
