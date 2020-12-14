import StorageConnection from './storage-connection'

/**
 * Configuration for a DID connection configuration
 */
export interface ConnectionConfig {
    // Optional private key (typically used in server environment)
    privateKey?: string
}

export interface StorageConnections {
    [key: string]: StorageConnection
}

/**
 * Configuration for a DID Storage instance
 */
export interface StorageConfig {
    name: string,
    databaseUri: string,
    applicationUri: string
}

export interface StorageIndex extends StorageConfig {
    asymPublicKey: Uint8Array,
    signPublicKey: Uint8Array
}

export enum KeyringKeyType {
    SIGN = 'sign',
    ASYM = 'asym',
    SYM = 'sym'
}

export interface KeyringPublicKeys {
    asymPublicKey: Uint8Array,
    asymPublicKeyBase58: string,
    signPublicKey: Uint8Array,
    signPublicKeyBase58: string,
}