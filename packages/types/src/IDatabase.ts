import { DatabaseCloseOptions, DatabaseDeleteConfig, DbRegistryEntry, EndpointUsage } from "./ContextInterfaces"

/**
 * Interface for any database returned from a storage engine
 */
export interface IDatabase {
    save(data: any, options?: any): Promise<boolean>

    getMany(filter?: any, options?: any): Promise<object[]>

    get(docId: any, options?: any): Promise<object | undefined>

    delete(doc: any, options?: any): Promise<boolean>

    deleteAll(): Promise<void>

    changes(cb: Function, options?: any): Promise<void>

    updateUsers(readList: string[], writeList: string[]): Promise<void>

    getDb(): Promise<any>

    info(): Promise<any>

    registryEntry(): Promise<DbRegistryEntry>

    close(options?: DatabaseCloseOptions): Promise<void>

    destroy(options?: DatabaseDeleteConfig): Promise<void>

    usage(): Promise<EndpointUsage>
}