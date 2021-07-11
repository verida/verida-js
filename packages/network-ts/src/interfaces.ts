import { AccountInterface } from '@verida/account'
import { Interfaces } from '@verida/storage-link'
import BaseStorage from './storage/base'

export interface ManagerConfig {
    defaultStorageServer: Interfaces.SecureStorageServer,
    defaultMessageServer: Interfaces.SecureStorageServer,
    account: AccountInterface

    ceramicUrl?: string
}

export interface StorageConnections {
    [key: string]: BaseStorage
}