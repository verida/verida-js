import AccountInterface from '../account-interface'

export interface DatabaseOpenConfig {
    permissions?: PermissionsConfig,
    did?: string,
    dsn?: string,
    saveDatabase?: boolean,
    readOnly?: boolean,
    isOwner?: boolean,
    encryptionKey?: string,
    createContext?: boolean
}

export interface DatastoreOpenConfig {
    permissions?: PermissionsConfig,
    did?: string,
    saveDatabase?: boolean,
    readOnly?: boolean,
    encryptionKey?: string,
    databaseName?: string,
    createContext?: boolean
}

export interface MessagesConfig {
    maxItems?: Number
}

export interface StorageEngineTypes {
    [key: string]: any
}

export interface PermissionsConfig {
    read: PermissionOptionsEnum,
    write: PermissionOptionsEnum,
    readList?: string[],
    writeList?: string[]
}

export enum PermissionOptionsEnum {
    OWNER = 'owner',
    PUBLIC = 'public',
    USERS = 'users'
}

export interface MessageSendConfig {
    recipientContextName?: string,
    expiry?: Number
}