/*import { Interfaces } from "@verida/storage-link"
import { Interfaces as DIDDocInterfaces } from "@verida/did-document"
import { ServiceEndpoint } from 'did-resolver'
import Account from "./account"*/


import { ServiceEndpoint } from 'did-resolver'
import { SecureContextEndpoint } from './DocumentInterfaces'
import { IAccount } from './IAccount'
import { SecureContextPublicKey } from './StorageLinkInterfaces'
import { CallType, VeridaMetaTransactionConfig, VeridaSelfTransactionConfig } from './Web3Interfaces'
import { DIDClientConfig } from './NetworkInterfaces'

export interface AccountConfig {
    defaultDatabaseServer: SecureContextEndpoint,
    defaultMessageServer: SecureContextEndpoint,
    defaultStorageServer?: SecureContextEndpoint,
    defaultNotificationServer?: SecureContextEndpoint,
}

export enum EnvironmentType {
    LOCAL = 'local',
    TESTNET = 'testnet',
    MAINNET = 'mainnet'
}

export interface AuthContext {
    publicSigningKey: SecureContextPublicKey
}

export interface AuthTypeConfig {
    force: boolean
}

export class AuthType {

    protected contextAuth?: AuthContext
    protected account: IAccount
    protected contextName: string
    protected serviceEndpoint: ServiceEndpoint
    protected signKey: SecureContextPublicKey

    public constructor(account: IAccount, contextName: string, serviceEndpoint: ServiceEndpoint, signKey: SecureContextPublicKey) {
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

export interface NodeAccountConfig {
    privateKey: string, // or mnemonic
    environment: EnvironmentType
    didClientConfig: DIDClientConfig
    options?: any
}