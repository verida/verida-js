import { Interfaces } from '@verida/storage-link'
import { Account } from '@verida/account'
import BaseStorageEngine from './context/engines/base'

export enum ClientEnvironment {
    LOCAL = "local",
    TESTNET = "testnet",
    MAINNET = "mainnet"
}

/**
 * Configuration for creating a new Client instance.
 */
export interface ClientConfig {
    /**
     * Environment to load by default.
     * 
     * Environment configuration can still be overriden by config items.
     */
    environment?: ClientEnvironment

    /**
     * URL of Ceramic node to use.
     */
    ceramicUrl?: string

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