import { Interfaces } from "@verida/storage-link"
import { Interfaces as DIDDocInterfaces } from "@verida/did-document"
import { ServiceEndpoint } from 'did-resolver'
import Account from "./account"

export interface AccountConfig {
    defaultDatabaseServer: DIDDocInterfaces.SecureContextEndpoint,
    defaultMessageServer: DIDDocInterfaces.SecureContextEndpoint,
    defaultStorageServer?: DIDDocInterfaces.SecureContextEndpoint,
    defaultNotificationServer?: DIDDocInterfaces.SecureContextEndpoint,
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
    protected serviceEndpoint: ServiceEndpoint
    protected signKey: Interfaces.SecureContextPublicKey

    public constructor(account: Account, contextName: string, serviceEndpoint: ServiceEndpoint, signKey: Interfaces.SecureContextPublicKey) {
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