import { IAccount } from './IAccount';
import { IStorageEngine } from './IStorageEngine';
import { SecureContextConfig } from './StorageLinkInterfaces';

export enum Network {  
	LOCAL = "local",  
	DEVNET = "devnet",
	BANKSIA = "banksia",  
	MYRTLE = "myrtle",  
}
  
/**  
 * @todo Deprecate in favour of `Network`
 */
export enum EnvironmentType {  
	LOCAL = Network.LOCAL,  
	DEVNET = Network.DEVNET,  
	BANKSIA = Network.BANKSIA,  
	MYRTLE = Network.MYRTLE,  

	/**  
	 * @deprecated use MYRTLE instead  
	 */
	MAINNET = Network.MYRTLE,  
	/**  
	 * @deprecated use BANKSIA instead  
	 */  
	TESTNET = Network.BANKSIA,  
}

export enum BlockchainAnchor {
	POLAMOY = "polamoy",
	POLPOS = "polpos",

	/**  
	 * @todo Remove once Amoy is deployed
	 */
	MUMBAI = "mumbai",

	/**  
	 * @deprecated use POLPOS instead  
	 */
	MAINNET = "polpos",

	/**  
	 * @deprecated use MUMBAI instead  
	 */
	TESTNET = "mumbai",
	//TESTNET = "polamoy",
	DEVNET = "mumbai"
}

export enum BlockchainNetworks {
	// mainnet
	//'mainnet' = "0x89",
	'polpos' = "0x89",

	// testnet
	//'testnet' = "0x13881",
	/**
	 * @todo Remove once Amoy is deployed
	 */
	'mumbai' = "0x13881",
	'devnet' = "0x13881"
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