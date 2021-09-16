import { Interfaces } from '@verida/storage-link'
import { Account } from '@verida/account'
import BaseStorageEngine from './context/engines/base'

export interface ClientConfig {
    environment?: string
    ceramicUrl?: string
    schemaPaths?: object
}

export interface ContextConfig {
    name: string,
    forceCreate?: boolean
}

export interface NetworkConnectionConfig {
    client: ClientConfig,
    context: ContextConfig
    account: Account
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