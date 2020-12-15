import StorageConnection from './storage-connection'
import Keyring from './keyring'

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

// key = sha256 hash of `${did}/${storageName}`
export interface Keyrings {
    [key: string]: Keyring
}

/**
 * Configuration for a DID Storage instance
 */
export interface StorageConfig {
    name: string,
    serverUri: string,
    applicationUri?: string
}

export interface StorageIndex extends StorageConfig {
    asymPublicKey: Uint8Array,
    signPublicKey: Uint8Array
}

export interface StorageServerConfig {
    keyring?: Keyring
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