import { AccountInterface } from '@verida/account'

export interface DatabaseOpenConfig {
    permissions?: PermissionsConfig,
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
    saveDatabase: boolean,

    databaseName?: string
}

export interface StorageEngineTypes {
    [key: string]: any
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
