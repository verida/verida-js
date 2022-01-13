import { Interfaces } from '@verida/storage-link'

export interface VaultAccountConfig {
    defaultDatabaseServer: Interfaces.SecureContextEndpoint,
    defaultMessageServer: Interfaces.SecureContextEndpoint,
    defaultStorageServer?: Interfaces.SecureContextEndpoint,
    defaultNotificationServer?: Interfaces.SecureContextEndpoint,
    vaultConfig?: VaultModalLoginConfig
}

export interface VaultModalLoginConfig {
    serverUri?: string,      // WSS URI
    loginUri?: string,       // Login URI (page where the user will be sent to login using the app; ie: vault.verida.io)
    canvasId?: string        // DOM id where the QR code canvas will be injected
    schemeUri?: string,
    logoUrl?: string,
    deeplinkId?: string,
    request?: object,        // Authorization request object that matches https://vault.schemas.verida.io/auth/loginRequest/latest/schema.json
    callback?(response: AuthResponse): void        // callback function (called when auth response received)
    callbackRejected?(): void   // callback function (called when user rejects / cancels the login by closing the modal)
}

export interface AuthClientConfig {
    appName: string,
    serverUri: string,      // WSS URI
    loginUri?: string,       // Login URI (page where the user will be sent to login using the app; ie: vault.verida.io)
    canvasId?: string        // DOM id where the QR code canvas will be injected
    schemeUri?: string,
    logoUrl?: string,
    deeplinkId?: string,
    request?: object,        // Authorization request object that matches https://vault.schemas.verida.io/auth/loginRequest/latest/schema.json
    callback(response: AuthResponse): void        // callback function (called when auth response received)
    callbackRejected?(): void   // callback function (called when user rejects / cancels the login by closing the modal)
}

export interface AuthResponse {
    type: string,
    success: boolean,
    message: string
}
