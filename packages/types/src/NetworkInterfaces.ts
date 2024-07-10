import { IAccount } from './IAccount';
import { IStorageEngine } from './IStorageEngine';
import { SecureContextConfig } from './StorageLinkInterfaces';

/**
 * Kind of Verida Networks
 */
export enum Network {  
	LOCAL = "local",  
	DEVNET = "devnet",
	BANKSIA = "banksia",  
	MYRTLE = "myrtle",  
}

/**
 * DID anchored chain for the {@link Network}
 */
export enum BlockchainAnchor {
	POLAMOY = "polamoy",
	POLPOS = "polpos",
	DEVNET = "polamoy"
}

export interface IContractInfo {
	address: string
	abi: any
}

/**
 * Interface for contract addresses of the Verida Network
 */
export interface INetworkContracts {
	token: IContractInfo | null
	didRegistry: IContractInfo | null
	storageNodeRegistry: IContractInfo | null
	nameRegistry: IContractInfo | null
	didLinkage: IContractInfo | null
	reward: IContractInfo | null
	solboundNFT: IContractInfo | null
}

export type TContractNames = keyof INetworkContracts;

/**
 * Include Verida network information including {@link NetworkContracts}
 */
export interface NetworkDefinition extends INetworkContracts {
	id: string
	label: string
	isMainnet: boolean
	anchoredBlockchain: BlockchainAnchor	
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
	network: Network;
	contextName: string;
	dbName: string;
	recordId: string;
	deepAttributes: string[];
	query: any;
}