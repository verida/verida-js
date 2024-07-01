import { IAccount } from './IAccount';
import { IStorageEngine } from './IStorageEngine';
import { SecureContextConfig } from './StorageLinkInterfaces';

export enum Network {  
	LOCAL = "local",  
	DEVNET = "devnet",
	BANKSIA = "banksia",  
	MYRTLE = "myrtle",  
}

export enum BlockchainAnchor {
	POLAMOY = "polamoy",
	POLPOS = "polpos",
	DEVNET = "polamoy"
}

export enum BlockchainNetworks {
	// mainnet
	//'mainnet' = "0x89",
	'polpos' = "0x89",
	'devnet' = "0x13882",
	'polamoy' = '0x13882'
}

export interface NetworkDefinition {  
	id: string
	label: string
	isMainnet: boolean
	anchoredBlockchain: BlockchainAnchor
	tokenAddress: string | null
	didRegistry: string | null
	storageNodeRegistryAddress: string | null
	nameRegistryAddress: string | null
	didLinkageAddress: string | null
	vdaRewardContract: string | null;
} 

export interface DefaultNetworkConfig {
	defaultDatabaseServerUrl?: string
	defaultMessageServerUrl?: string
	schemaPaths?: Record<string,string>
	readOnlyDataApiUri?: string
}

export interface DefaultClientConfig extends DefaultNetworkConfig {
	network: Network
	environments: Record<string, DefaultNetworkConfig>
	vaultAppName: string
}

export interface DIDClientConfig {
	network?: Network
	blockchain?: BlockchainAnchor
    rpcUrl?: string					// blockchain RPC URI to use
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
	 * Verida network to load by default.
	 *
	 * Verida network can still be overridden by config items.
	 */
	network?: Network;

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