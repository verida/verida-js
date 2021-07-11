import { AccountInterface } from '@verida/account'
import { PermissionsConfig } from '../interfaces'
import DatastoreServerClient from './client'

export interface VeridaDatabaseConfig {
    databaseName: string
    did: string,
    storageContext: string,
    dsn: string,

    account?: AccountInterface,
    permissions?: PermissionsConfig,
    
    signAccount?: AccountInterface,
    signStorageContext?: string,
    signData?: boolean

    readOnly?: boolean,
    isOwner?: boolean,
    encryptionKey?: Buffer

    client: DatastoreServerClient
}