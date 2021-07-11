
export interface SecureContextPublicKey {
    type: string,
    base58: string
}

export interface SecureStorageContextPublicKeys {
    asymKey: SecureContextPublicKey,
    signKey: SecureContextPublicKey,
}

export interface SecureStorageServer {
    type: string,
    endpointUri: string,
    config?: object
}

export interface SecureStorageContextServices {
    storageServer: SecureStorageServer,
    messageServer: SecureStorageServer
}

export interface SecureStorageContextConfig {
    id: string,
    publicKeys: SecureStorageContextPublicKeys,
    services: SecureStorageContextServices
}

export interface SecureStorageContexts {
    contexts: SecureStorageContextConfig[]
}