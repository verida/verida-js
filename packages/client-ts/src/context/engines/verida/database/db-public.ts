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
