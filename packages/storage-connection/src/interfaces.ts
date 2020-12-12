

/**
 * Configuration for a DID connection configuration
 */
export interface ConnectionConfig {
    // Optional private key (typically used in server environment)
    privateKey?: string
}

/**
 * Configuration for a DID Storage instance
 */
export interface StorageConfig {
    publicKeys: PublicKey[],
    authKeys: AuthKey[],
    databaseUri: string,
    applicationUri: string
}

export interface PublicKey {
    id: string,
    type: string,
    controller: string,
    publicKeyHex: string
}

export interface AuthKey {
    publicKey: string,
    type: string
}