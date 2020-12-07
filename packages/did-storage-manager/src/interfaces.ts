
/**
 * Configuration for a DID storage provider
 */
export interface StorageProviderConfig {
    // Optional private key (typically used in server environment)
    privateKey?: string
}

/**
 * Configuration for a DID Storage instance
 */
export interface StorageConfig {
    publicKeys: string[],
    authKeys: string[],
    databaseUri: string,
    applicationUri: string
}
