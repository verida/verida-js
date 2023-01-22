import { Signer } from '@ethersproject/abstract-signer';
import { IAccount } from './IAccount';
import { IStorageEngine } from './IStorageEngine';
import { SecureContextConfig } from './StorageLinkInterfaces';
import { CallType, VeridaMetaTransactionConfig, VeridaSelfTransactionConfig } from './Web3Interfaces';

export declare enum EnvironmentType {
    LOCAL = "local",
    TESTNET = "testnet",
    MAINNET = "mainnet"
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

	didClientConfig?: ClientDIDClientConfig

	/**
	 * Specify custom schema paths (typically for local development).
	 */
	schemaPaths?: object;
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
	id: string;
	query: any;
}

export interface DefaultEnvironmentConfig {
	defaultDatabaseServerUrl?: string
	defaultMessageServerUrl?: string
	schemaPaths?: Record<string,string>
}

export interface DefaultClientConfig extends DefaultEnvironmentConfig {
	environment: EnvironmentType
	environments: Record<string, DefaultEnvironmentConfig>
	vaultAppName: string
}

// Part of VeridaSelfTransactionConfig
export interface VeridaSelfTransactionConfigPart  {
    signer?: Signer         // Pre-built transaction signer that is configured to pay for gas
    privateKey?: string     // MATIC private key that will pay for gas
}

export interface DIDClientConfig {
    network: 'testnet' | 'mainnet'              // `testnet` OR `mainnet`
    rpcUrl?: string                              // blockchain RPC URI to use
    timeout?: number
}

/**
 * Modified version of DID Client config to simplify Client configuration
 * (pulls `network` from client config)
 */
export interface ClientDIDClientConfig extends Omit<DIDClientConfig, 'network'> {
    callType: CallType,
    web3Config: VeridaSelfTransactionConfig | VeridaMetaTransactionConfig,
    didEndpoints: string[]
}