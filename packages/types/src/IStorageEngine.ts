import { ContextDatabaseInfo, DatabaseDeleteConfig, DatabaseOpenConfig, DatastoreOpenConfig, DbRegistry } from "./ContextInterfaces"
import { IAccount } from "./IAccount"
import { IContext } from "./IContext"
import { IDatabase } from "./IDatabase"
import { IDatastore } from "./IDatastore"
import { IKeyring } from "./IKeyring"
import { SecureContextConfig } from "./StorageLinkInterfaces"

/**
 * @emits EndpointUnavailable
 */
export interface IStorageEngine {

  constructor(
    context: IContext,
    dbRegistry: DbRegistry,
    contextConfig: SecureContextConfig,
  ): void

   getKeyring(): IKeyring

   getContextConfig(): SecureContextConfig

   getAccount(): IAccount

    connectAccount(account: IAccount): Promise<void>

     getDbRegistry(): DbRegistry
     

  openDatabase(
    databaseName: string,
    config: DatabaseOpenConfig
  ): Promise<IDatabase> 

    openDatastore(
    schemaName: string,
    config: DatastoreOpenConfig
  ): Promise<IDatastore> 

    deleteDatabase(
    databaseName: string,
    config: DatabaseDeleteConfig
  ): Promise<void>

   logout(): void

   addEndpoint(context: IContext, uri: string): Promise<boolean>

    info(): Promise<ContextDatabaseInfo> 
}