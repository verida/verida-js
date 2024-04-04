import { IAccount } from './IAccount';
import { IStorageEngine } from './IStorageEngine';
import { SecureContextConfig } from './StorageLinkInterfaces';

export enum EnvironmentType {
    LOCAL = "local",
	DEVNET = "devnet",
	BANKSIA = "banksia",
	MYRTLE = "myrtle",

	// For backwards compatibility
	// Will be removed in the future
	MAINNET = "myrtle",
	TESTNET = "banksia"
}

export enum BlockchainAnchor {
	POLAMOY = "polamoy",
	POLPOS = "polpos",
	MUMBAI = "mumbai"

	MAINNET = "polpos",
	//TESTNET = "polamoy",
	TESTNET = "mumbai"
}

export interface DefaultEnvironmentConfig {
	defaultDatabaseServerUrl?: string
	defaultMessageServerUrl?: string
	schemaPaths?: Record<string,string>
	readOnlyDataApiUri?: string
}

export interface DefaultClientConfig extends DefaultEnvironmentConfig {
	environment: EnvironmentType
	environments: Record<string, DefaultEnvironmentConfig>
	vaultAppName: string
}

export interface DIDClientConfig {
    network: EnvironmentType              // `testnet` OR `mainnet`
    rpcUrl?: string                              // blockchain RPC URI to use
    timeout?: number
}

/**
 * Interface for ClientConfig
 */
export interface ClientConfig {
	/**
	 * Specify client's App name.
	 */
	vaultAppName?: string;
	
	/**
	 * Environment to load by default.
	 *
	 * Environment configuration can still be overridden by config items.
	 */
	environment?: EnvironmentType;

	didClientConfig?: DIDClientConfig

	/**
	 * Specify custom schema paths (typically for local development).
	 */
	schemaPaths?: object;

	/**
	 * URL of the Data API for cached fetching of read only network data
	 */
	readOnlyDataApiUri?: string;
}

/**
 * Interface for ContextConfig
 */
export interface ContextConfig {
	name: string;
	forceCreate?: boolean;
}

/**
 * Interface for NetworkConnectionConfig
 */
export interface NetworkConnectionConfig {
	client?: ClientConfig;
	context: ContextConfig;
	account: IAccount;
}

/**
 * Interface for DIDContextConfigs
 * key = contextName
 * value = SecureStorageContextConfig
 */
export interface DIDContextConfigs {
	[key: string]: SecureContextConfig;
}

/**
 * key = DID string
 * value = BaseStorageEngine
 */

/**
 * Interface for any DatabaseEngines
 */
export interface DatabaseEngines {
	[key: string]: IStorageEngine;
}

export interface FetchUriParams {
	did: string;
	contextName: string;
	dbName: string;
	recordId: string;
	deepAttributes: string[];
	query: any;
}