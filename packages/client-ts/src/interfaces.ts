import { Interfaces } from '@verida/storage-link'
import { Account, EnvironmentType } from '@verida/account'
import BaseStorageEngine from './context/engines/base'

/**
 * Configuration for creating a new Client instance.
 */
export interface ClientConfig {
    /**
     * Environment to load by default.
     * 
     * Environment configuration can still be overriden by config items.
     */
    environment?: EnvironmentType

    /**
     * URL of Verida DID Server node to use.
     */
    didServerUrl?: string

    /**
     * Specify custom schema paths (typicaly for local development).
     */
    schemaPaths?: object
}

export interface ContextConfig {
    name: string,
    forceCreate?: boolean
}

export interface NetworkConnectionConfig {
    client?: ClientConfig,
    context: ContextConfig
    account: Account
}

/**
 * key = contextName
 * value = SecureStorageContextConfig
 */
export interface DIDContextConfigs {
    [key: string]: Interfaces.SecureContextConfig
}

/**
 * key = DID string
 * value = BaseStorageEngine
 */
export interface DatabaseEngines {
    [key: string]: BaseStorageEngine
}