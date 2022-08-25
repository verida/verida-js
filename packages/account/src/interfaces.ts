import { Interfaces } from "@verida/storage-link"
import Account from "./account"

export interface AccountConfig {
    defaultDatabaseServer: Interfaces.SecureContextEndpoint,
    defaultMessageServer: Interfaces.SecureContextEndpoint,
    defaultStorageServer?: Interfaces.SecureContextEndpoint,
    defaultNotificationServer?: Interfaces.SecureContextEndpoint,
}

export enum EnvironmentType {
    LOCAL = 'local',
    TESTNET = 'testnet',
    MAINNET = 'mainnet'
}

export interface AuthContext {
    publicSigningKey: string
}

export interface AuthTypeConfig {
}

export interface AuthType {
    getAuthContext(account: Account, contextName: string, config: AuthTypeConfig): Promise<AuthContext>
}


//// VeridaDatabase Authentication Interfaces

export interface VeridaDatabaseAuthContext extends AuthContext {
    refreshToken: string,
    accessToken: string,
    host: string
}

export interface VeridaDatabaseAuthTypeConfig extends AuthTypeConfig {
  serverUrl: string,
  deviceId: string,
  forceAccessToken: boolean
  publicSigningKey: string
}