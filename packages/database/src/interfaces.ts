
export interface DatabaseConfig {
    dbName: string,
    did: string,
    appName: string,
    user: any,

    permissions: PermissionsConfig,
    readOnly: boolean,

    signAppName: string,
    signUser: any,
    signData: boolean,

    dataserver: any
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