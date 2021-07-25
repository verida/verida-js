import { AccountInterface } from '@verida/account'


export interface DatabaseOpenConfig {
    permissions?: PermissionsConfig,
    account?: AccountInterface,
    did?: string,
    dsn?: string,
    saveDatabase?: boolean,
    readOnly?: boolean,
    isOwner?: boolean,
    encryptionKey?: string
}

export interface DatastoreOpenConfig {
    permissions: PermissionsConfig,
    account: AccountInterface,
    did: string,
    saveDatabase: boolean
}

export interface PermissionsConfig {
    read: PermissionOptionsEnum,
    write: PermissionOptionsEnum,
    readList: string[],
    writeList: string[]
}

export enum PermissionOptionsEnum {
    OWNER = 'owner',
    PUBLIC = 'public',
    USERS = 'users'
}

// Not used!?
export interface DatabaseConfig {
    /*dbName: string,         // Name of the database to connect to
    did: string,            // DID of the dat
    appName: string,*/
    dsn: string,                // verida://<did>/<vaultName>/<dbName>?key=<encryptionKey>
    //user: any,

    permissions: PermissionsConfig,
    readOnly: boolean,

    signKey: string,            // Hex(?) key used to sign data
    signData: boolean,          // Indicate if data should be signed when saved

    //dataserver?: any            // Create from DSN
}

/**
 * Interface for any database returned from a storage engine
 */
export interface Database {

    save(data: any, options: any): Promise<boolean>
    getMany(filter: any, options: any): Promise<object[] | undefined>
    get(docId: any, options: any): Promise<object | undefined>
    delete(doc: any, options: any): Promise<boolean>
    changes(cb: Function): Promise<void>
    updateUsers(readList: string[], writeList: string[]): Promise<void>
    getDb(): Promise<any>
    init(): Promise<void>

}