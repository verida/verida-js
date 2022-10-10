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
    publicSigningKey: Interfaces.SecureContextPublicKey
}

export interface AuthTypeConfig {
    force: boolean
}

export class AuthType {

    protected contextAuth?: AuthContext
    protected account: Account
    protected contextName: string
    protected serviceEndpoint: Interfaces.SecureContextEndpoint
    protected signKey: Interfaces.SecureContextPublicKey

    public constructor(account: Account, contextName: string, serviceEndpoint: Interfaces.SecureContextEndpoint, signKey: Interfaces.SecureContextPublicKey) {
        this.account = account
        this.contextName = contextName
        this.serviceEndpoint = serviceEndpoint
        this.signKey = signKey
    }

    getAuthContext(config: AuthTypeConfig): Promise<AuthContext> {
        throw new Error("Not implemented")
    }

    setAuthContext(contextAuth: AuthContext) {
        this.contextAuth = contextAuth
    }

    disconnectDevice(deviceId: string="Test device"): Promise<boolean> {
        throw new Error("Not implemented")
    }
}

//// VeridaDatabase Authentication Interfaces

export interface VeridaDatabaseAuthContext extends AuthContext {
    refreshToken?: string,
    accessToken?: string,
    endpointUri: string,
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