import { SecureContextEndpoint } from "./DocumentInterfaces"

export interface SecureContextPublicKey {
    type: string,
    publicKeyHex: string
}

export interface SecureStorageContextPublicKeys {
    asymKey: SecureContextPublicKey,
    signKey: SecureContextPublicKey,
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
    isLegacyDid: boolean
}