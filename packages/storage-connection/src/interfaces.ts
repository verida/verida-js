

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
    name: string,
    databaseUri: string,
    applicationUri: string
}