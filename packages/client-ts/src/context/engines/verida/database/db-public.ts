import BaseDb from "./base-db";
import { DbRegistryEntry } from "../../../db-registry";

/**
 * @category
 * Modules
 */
class PublicDatabase extends BaseDb {

  public async info(): Promise<any> {
    await this.init();

    const endpoints = []
    for (let i in this.endpoints) {
      endpoints.push(this.endpoints[i].toString())
    }

    const info = {
      type: "VeridaDatabase",
      privacy: "public",
      did: this.did,
      endpoints,
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
