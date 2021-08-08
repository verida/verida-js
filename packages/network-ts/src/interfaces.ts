import { Interfaces } from '@verida/storage-link'
import BaseStorageEngine from './context/engines/base'

export interface ManagerConfig {
    environment?: string
    ceramicUrl?: string
    defaultStorageServerUrl?: Interfaces.SecureStorageServer,
    defaultMessageServerUrl?: Interfaces.SecureStorageServer,
    schemaPaths?: object
}

// key = contextName
// value = SecureStorageContextConfig
export interface DIDContextConfigs {
    [key: string]: Interfaces.SecureStorageContextConfig
}

// key = DID string
// value = BaseStorageEngine
export interface StorageEngines {
    [key: string]: BaseStorageEngine
}