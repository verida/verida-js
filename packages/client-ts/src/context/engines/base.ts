import { Account } from "@verida/account";
import { Keyring } from "@verida/keyring";
import { ContextDatabaseInfo, DatabaseDeleteConfig, DatabaseOpenConfig, DatastoreOpenConfig } from "../interfaces";
import Database from "../database";
import Datastore from "../datastore";
import DbRegistry from "../db-registry";
import ContextNotFoundError from "./ContextNotFoundError";
import { Interfaces } from "@verida/storage-link";
import Context from '../context';
import { EventEmitter } from 'events'

/**
 * @emits EndpointUnavailable
 */
class BaseStorageEngine extends EventEmitter {
  protected context: Context
  protected storageContext: string;
  protected dbRegistry: DbRegistry;
  protected contextConfig: Interfaces.SecureContextConfig;

  protected account?: Account;
  protected keyring?: Keyring;

  constructor(
    context: Context,
    dbRegistry: DbRegistry,
    contextConfig: Interfaces.SecureContextConfig,
  ) {
    super()
    this.context = context
    this.storageContext = context.getContextName();
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

  public async deleteDatabase(
    databaseName: string,
    config: DatabaseDeleteConfig
  ): Promise<void> {
    throw new Error("Not implemented");
  }

  public logout() {
    this.account = undefined;
    this.keyring = undefined;
  }

  public addEndpoint(context: Context, uri: string): Promise<boolean> {
    throw new Error('Not implemented')
  }

  public async info(): Promise<ContextDatabaseInfo> {
    throw new Error('Not implemented')
  }
}

export default BaseStorageEngine;
