
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