import { Interfaces } from "@verida/storage-link"

export interface AccountConfig {
    defaultDatabaseServer: Interfaces.SecureContextEndpoint,
    defaultMessageServer: Interfaces.SecureContextEndpoint,
    defaultStorageServer?: Interfaces.SecureContextEndpoint,
}

export enum EnvironmentType {
    LOCAL = 'local',
    TESTNET = 'testnet',
    MAINNET = 'mainnet'
}