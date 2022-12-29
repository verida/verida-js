import { Account } from "@verida/account";
import { Keyring } from "@verida/keyring";
import { DatabaseOpenConfig, DatastoreOpenConfig } from "../interfaces";
import Database from "../database";
import Datastore from "../datastore";
import DbRegistry from "../db-registry";
import ContextNotFoundError from "./ContextNotFoundError";
import { Interfaces } from "@verida/storage-link";
import Context from '../context';
import { EventEmitter } from 'events'

/**
 * @category
 * Modules
 */
class BaseStorageEngine extends EventEmitter {
  protected storageContext: string;
  protected dbRegistry: DbRegistry;
  protected contextConfig: Interfaces.SecureContextConfig;

  protected account?: Account;
  protected keyring?: Keyring;

  constructor(
    storageContext: string,
    dbRegistry: DbRegistry,
    contextConfig: Interfaces.SecureContextConfig,
  ) {
    super()
    this.storageContext = storageContext;
    this.dbRegistry = dbRegistry;
    this.contextConfig = contextConfig
  }

  public getKeyring() {
    return this.keyring
  }

  public getContextConfig() {
    return this.contextConfig
  }

  public getAccount() {
    return this.account
  }

  public async connectAccount(account: Account) {
    try {
      this.account = account;
      this.keyring = await account.keyring(this.storageContext);
    } catch (err: any) {
      this.account = undefined
      throw new ContextNotFoundError("Unable to generate Keyring")
    }
  }

  public getDbRegistry() {
    return this.dbRegistry
  }

  public async openDatabase(
    databaseName: string,
    config: DatabaseOpenConfig
  ): Promise<Database> {
    throw new Error("Not implemented");
  }

  public async openDatastore(
    schemaName: string,
    config: DatastoreOpenConfig
  ): Promise<Datastore> {
    throw new Error("Not implemented");
  }

  public logout() {
    this.account = undefined;
    this.keyring = undefined;
  }

  public addEndpoint(context: Context, uri: string): Promise<boolean> {
    throw new Error('Not implemented')
  }
}

export default BaseStorageEngine;
