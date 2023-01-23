import { AuthContext, AuthTypeConfig } from "./AccountInterfaces";
import { ContextCloseOptions, ContextEngineType, ContextInfo, DatabaseOpenConfig, DatastoreOpenConfig, MessagesConfig } from "./ContextInterfaces";
import { IStorageEngine } from "./IStorageEngine";
import { IClient } from "./IClient";
import { IDatabase } from "./IDatabase";
import { IDatastore } from "./IDatastore";
import { IDIDContextManager } from "./IDIDContextManager";
import { SecureContextConfig } from "./StorageLinkInterfaces";
import { IAccount } from "./IAccount";
import { IProfile } from "./IProfile";
import { IMessaging } from "./IMessaging";
import { INotification } from "./INotification";
import { IDbRegistry } from "./IDbRegistry";

export interface IContext extends EventEmitter {
  getContextConfig(
    did?: string,
    forceCreate?: boolean,
    customContextName?: string
  ): Promise<SecureContextConfig>

  getContextName(): string 

  getAccount(): IAccount 

  getDidContextManager(): IDIDContextManager 

  getClient(): IClient 

  disconnect(): Promise<boolean> 

  getDatabaseEngine(
    did: string,
    createContext?: boolean
  ): Promise<IStorageEngine> 

  getMessaging(messageConfig: MessagesConfig): Promise<IMessaging> 

  getNotification(did: string, contextName: string): Promise<INotification | undefined> 

  openProfile(
    profileName?: string,
    did?: string,
    writeAccess?: boolean
  ): Promise<IProfile | undefined> 

  openDatabase(
    databaseName: string,
    config: DatabaseOpenConfig
  ): Promise<IDatabase>


  openExternalDatabase(
    databaseName: string,
    did: string,
    config: DatabaseOpenConfig
  ): Promise<IDatabase>


  openDatastore(
    schemaUri: string,
    config: DatastoreOpenConfig
  ): Promise<IDatastore>


  openExternalDatastore(
    schemaUri: string,
    did: string,
    options: DatastoreOpenConfig
  ): Promise<IDatastore> 

  getDbRegistry(): IDbRegistry

  info(): Promise<ContextInfo> 

  getAuthContext(authConfig?: AuthTypeConfig, authType?: string): Promise<AuthContext>

  addEndpoint(engineType: ContextEngineType, endpointUri: string): void

  close(options: ContextCloseOptions): Promise<void>

  clearDatabaseCache(did: string, databaseName: string): Promise<void>

}
