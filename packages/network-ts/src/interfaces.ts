import { Interfaces } from '@verida/storage-link'
import BaseStorageEngine from './context/engines/base'

export interface ManagerConfig {
    defaultStorageServer: Interfaces.SecureStorageServer,
    defaultMessageServer: Interfaces.SecureStorageServer,

    ceramicUrl?: string
}

// key = contextName
// value = SecureStorageContextConfig
export interface DIDContextConfigs {
    [key: string]: DIDConfigs
}

// key = DID string
// value = SecureStorageContextConfig
export interface DIDConfigs {
    [key: string]: Interfaces.SecureStorageContextConfig
}

// key = DID string
// value = BaseStorageEngine
export interface StorageEngines {
    [key: string]: BaseStorageEngine
}