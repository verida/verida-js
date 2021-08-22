import { Interfaces } from '@verida/storage-link'
import BaseStorageEngine from './context/engines/base'

export interface ManagerConfig {
    environment?: string
    ceramicUrl?: string
    defaultDatabaseServer?: Interfaces.SecureContextEndpoint,
    defaultMessageServer?: Interfaces.SecureContextEndpoint,
    schemaPaths?: object
}

// key = contextName
// value = SecureStorageContextConfig
export interface DIDContextConfigs {
    [key: string]: Interfaces.SecureContextConfig
}

// key = DID string
// value = BaseStorageEngine
export interface DatabaseEngines {
    [key: string]: BaseStorageEngine
}