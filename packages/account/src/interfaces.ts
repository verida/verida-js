import { Interfaces } from "@verida/storage-link"

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

/**
 * A generic interface that represents the authorization details
 * of a given context.
 * 
 * The actual implementation will depend on the type of service.
 * 
 * Each implementation should extend this interface with it's 
 * own appropriate configuration (ie: access, refresh token etc.)
 */
export interface ContextAuth {}