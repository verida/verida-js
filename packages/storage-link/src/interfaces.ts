import { ServiceEndpoint } from "did-resolver"
import { Interfaces } from '@verida/did-document'

export interface SecureContextPublicKey {
    type: string,
    publicKeyHex: string
}

export interface SecureStorageContextPublicKeys {
    asymKey: SecureContextPublicKey,
    signKey: SecureContextPublicKey,
}

export interface SecureContextServices {
    databaseServer: Interfaces.SecureContextEndpoint,
    messageServer: Interfaces.SecureContextEndpoint,
    storageServer?: Interfaces.SecureContextEndpoint,
    notificationServer?: Interfaces.SecureContextEndpoint
}

export interface SecureContextConfig {
    id: string,
    publicKeys: SecureStorageContextPublicKeys,
    services: SecureContextServices
}