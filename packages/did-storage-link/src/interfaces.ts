
export interface SecureContextPublicKey {
    type: string,
    base58: string
}

export interface SecureStorageContextPublicKeys {
    asymKey: SecureContextPublicKey,
    signKey: SecureContextPublicKey,
}

export interface SecureStorageContextServices {
    storageEndpoint: string,
    messageEndpoint: string
}

export interface SecureStorageContextConfig {
    id: string,
    publicKeys: SecureStorageContextPublicKeys,
    services: SecureStorageContextServices
}

export interface SecureStorageContexts {
    contexts: SecureStorageContextConfig[]
}