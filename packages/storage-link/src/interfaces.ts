
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
    databaseServer: SecureContextEndpoint,
    messageServer: SecureContextEndpoint,
    storageServer?: SecureContextEndpoint,
    notificationServer?: SecureContextEndpoint
}

export interface SecureContextConfig {
    id: string,
    publicKeys: SecureStorageContextPublicKeys,
    services: SecureContextServices
}