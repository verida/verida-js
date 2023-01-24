import { DatabaseCloseOptions, DatastoreOpenConfig } from "./ContextInterfaces"
import { IContext } from "./IContext"
import { IDatabase } from "./IDatabase"

export interface IDatastore {
    save(data: any, options: any): Promise<object | boolean>

    getMany(
        customFilter: any,
        options: any
    ): Promise<object[]>

    getOne(
        customFilter: any,
        options: any
    ): Promise<object | undefined>

    get(key: string, options: any): Promise<any>

    delete(docId: string): Promise<any>

    deleteAll(): Promise<void>

    getDb(): Promise<IDatabase>

    changes(cb: any, options: any): Promise<any> 

    ensureIndexes(indexes: any): Promise<void>

    updateUsers(
        readList: string[],
        writeList: string[]
    ): Promise<void>

    close(options: DatabaseCloseOptions): Promise<void>
}