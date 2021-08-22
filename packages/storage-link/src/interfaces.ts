
export interface SecureContextPublicKey {
    type: string,
    base58: string
}

export interface SecureStorageContextPublicKeys {
    asymKey: SecureContextPublicKey,
    signKey: SecureContextPublicKey,
}

export interface SecureContextEndpoint {
    type: string,
    endpointUri: string,
    config?: object
}

export interface SecureContextServices {
    storageServer?: SecureContextEndpoint,
    databaseServer: SecureContextEndpoint,
    messageServer: SecureContextEndpoint
}

export interface SecureContextConfig {
    id: string,
    publicKeys: SecureStorageContextPublicKeys,
    services: SecureContextServices
}

export interface SecureContexts {
    contexts: SecureContextConfig[]
}