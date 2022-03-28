import { Interfaces } from '@verida/storage-link'

export interface VaultAccountRequest {
    logoUrl?: string,        // Optional URL that will be displayed as part of the login process
}

export interface VaultAccountConfig {
    serverUri?: string,      // WSS URI
    loginUri?: string,       // Login URI (page where the user will be sent to login using the app; ie: vault.verida.io)
    canvasId?: string        // DOM id where the QR code canvas will be injected
    schemeUri?: string,
    deeplinkId?: string,
    request?: VaultAccountRequest,
    callback?(response: AuthResponse): void        // callback function (called when auth response received)
    callbackRejected?(): void   // callback function (called when user rejects / cancels the login by closing the modal)
}

export interface AuthClientConfig {
    appName: string,
    serverUri: string,      // WSS URI
    loginUri?: string,       // Login URI (page where the user will be sent to login using the app; ie: vault.verida.io)
    canvasId?: string        // DOM id where the QR code canvas will be injected
    schemeUri?: string,
    deeplinkId?: string,
    request?: VaultAccountRequest,
    callback(response: AuthResponse): void        // callback function (called when auth response received)
    callbackRejected?(): void   // callback function (called when user rejects / cancels the login by closing the modal)
}

export interface AuthResponse {
    type: string,
    success: boolean,
    message: string
}
