import { Keyring } from '@verida/keyring';
import { PermissionsConfig } from '../../interfaces'
import DatastoreServerClient from './client'

export interface VeridaDatabaseConfig {
    databaseName: string
    did: string,
    storageContext: string,
    dsn: string,

    keyring?: Keyring,
    permissions?: PermissionsConfig,
    
    signKeyring?: Keyring,
    signDid?: string,
    signData?: boolean,
    signContextName?: string,

    readOnly?: boolean,
    isOwner?: boolean,
    encryptionKey?: Buffer

    client: DatastoreServerClient
}