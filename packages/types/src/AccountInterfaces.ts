import { ServiceEndpoint } from 'did-resolver'
import { SecureContextEndpoint } from './DocumentInterfaces'
import { SecureContextConfig, SecureContextPublicKey } from './StorageLinkInterfaces'
import { DIDClientConfig, EnvironmentType } from './NetworkInterfaces'
import { Web3CallType, Web3MetaTransactionConfig, Web3SelfTransactionConfig } from './Web3Interfaces'

export interface AccountConfig {
    defaultDatabaseServer: SecureContextEndpoint,
    defaultMessageServer: SecureContextEndpoint,
    defaultStorageServer?: SecureContextEndpoint,
    defaultNotificationServer?: SecureContextEndpoint,
}

export interface AuthContext {
    publicSigningKey: SecureContextPublicKey
}

export interface AuthTypeConfig {
    force?: boolean
}

export interface VeridaDatabaseAuthContext extends AuthContext {
    refreshToken?: string,
    accessToken?: string,
    endpointUri: ServiceEndpoint,
    host: string
}

export interface VeridaDatabaseAuthTypeConfig extends AuthTypeConfig {
  deviceId?: string,
  endpointUri?: string,
  invalidAccessToken?: boolean
}

export class ContextAuthorizationError extends Error {
    constructor(message: string) {
        super(message)
        this.name = "ContextAuthorizationError"
    }
}

export interface AccountNodeConfig {
    privateKey: string, // or mnemonic
    environment: EnvironmentType
    didClientConfig: AccountNodeDIDClientConfig
    options?: any
    countryCode?: string
}

/**
 * Client configuration required for AccountNode that will support creating a DID
 * on chain, if required
 */
export interface AccountNodeDIDClientConfig extends Omit<DIDClientConfig, 'network'> {
    callType: Web3CallType,
    web3Config: Web3SelfTransactionConfig | Web3MetaTransactionConfig,
    didEndpoints?: string[]
}

export interface WalletConnectConfig {
    version: string,
    uri: string,
    chainId: string
}

export interface AccountVaultRequest {
    logoUrl?: string,       // Optional URL that will be displayed as part of the login process
    openUrl?: string,       // Optional URL that will be opened on the user's mobile device once the user is logged in
    walletConnect?: {       // Optional, WalletConnect configuration to enable a seamless connection with both Verida and WalletConnect with a single request
        version: number,    // Required, WalletConnect version used by the dApp
        uri: string,        // Required, WalletConnect connector URI
        chainId: string     // Required, CAIP compliant chainId
    }
    userAgent?: string      // User Agent that originated the request
}

export interface AccountVaultConfig {
    serverUri?: string,      // WSS URI
    loginUri?: string,       // Login URI (page where the user will be sent to login using the app; ie: vault.verida.io)
    canvasId?: string        // DOM id where the QR code canvas will be injected
    schemeUri?: string,
    deeplinkId?: string,
    request?: AccountVaultRequest,
    environment?: EnvironmentType,
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
    request?: AccountVaultRequest,
    callback(response: AuthResponse): void        // callback function (called when auth response received)
    callbackRejected?(): void   // callback function (called when user rejects / cancels the login by closing the modal)
}

export interface AuthResponse {
    type: string,
    success: boolean,
    message: string
}

export interface LockedEndpointAccountConfig {
    did: string,
    contextName: string,
    contextConfig: SecureContextConfig
    signature: string
    contextAuths: VeridaDatabaseAuthContext[]
}