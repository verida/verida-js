import { IContext } from "./IContext"
import { IDatabase } from "./IDatabase"

export interface IDbRegistry { 
    saveDb(database: IDatabase, checkPermissions: boolean): Promise<void>
  
    removeDb(databaseName: string, did: string, contextName: string): Promise<boolean>
  
    getMany(filter: any, options: any): Promise<any[]>
  
    get(
        dbName: string,
        did: string,
        contextName: string
    ): Promise<any>
  
    init(): Promise<void>
  }