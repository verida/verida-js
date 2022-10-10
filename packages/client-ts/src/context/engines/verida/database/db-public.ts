import BaseDb from "./base-db";
import { DbRegistryEntry } from "../../../db-registry";
import * as PouchDBFind from "pouchdb-find";
import * as PouchDBLib from "pouchdb";

// See https://github.com/pouchdb/pouchdb/issues/6862
const { default: PouchDB } = PouchDBLib as any;

PouchDB.plugin(PouchDBFind);

/**
 * @category
 * Modules
 */
class PublicDatabase extends BaseDb {
  private _remoteDb: any;

  public async init() {
    if (this._remoteDb) {
      return;
    }

    await super.init();

    const databaseName = this.databaseName;
    const dbConfig: any = {
      skip_setup: true,
    }

    if (this.token) {
      const instance = this
      dbConfig['fetch'] = async function(url: string, opts: any) {
        opts.headers.set('Authorization', `Bearer ${instance.getAccessToken()}`)
        const result = await PouchDB.fetch(url, opts)
        if (result.status == 401) {
          // Unauthorized, most likely due to an invalid access token
          // Fetch new credentials and try again
          await instance.getEngine().reAuth(instance)

          opts.headers.set('Authorization', `Bearer ${instance.getAccessToken()}`)
          const result = await PouchDB.fetch(url, opts)

          if (result.status == 401) {
            throw new Error(`Permission denied to access server: ${this.dsn}`)
          }

          // Return an authorized result
          return result
        }

        // Return an authorized result
        return result
      }
    }

    this._remoteDb = new PouchDB(`${this.dsn}/${this.databaseHash}`, dbConfig);

    try {
      let info = await this._remoteDb.info();
      if (info.error && info.error == "not_found") {
        if (this.isOwner) {
          await this.createDb();
        } else {
          throw new Error(`Public database not found: ${databaseName}`);
        }
      }
    } catch (err: any) {
      if (this.isOwner) {
        await this.createDb();
      } else {
        throw new Error(`Public database not found: ${databaseName}`);
      }
    }

    this.db = this._remoteDb;
  }

  public async getDb() {
    if (!this._remoteDb) {
      await this._init();
    }

    return this._remoteDb;
  }

  public async info(): Promise<any> {
    await this.init();

    const info = {
      type: "VeridaDatabase",
      privacy: "public",
      did: this.did,
      dsn: this.dsn,
      permissions: this.permissions!,
      storageContext: this.storageContext,
      databaseName: this.databaseName,
      databaseHash: this.databaseHash,
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
    };
  }
}

export default PublicDatabase;
