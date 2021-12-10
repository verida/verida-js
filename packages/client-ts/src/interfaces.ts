import { Interfaces } from '@verida/storage-link';
import { Account, EnvironmentType } from '@verida/account';
import BaseStorageEngine from './context/engines/base';

/**
 * Interface for ClientConfig
 */
export interface ClientConfig {
	/**
	 * Environment to load by default.
	 *
	 * Environment configuration can still be overriden by config items.
	 */
	environment?: EnvironmentType;

	/**
	 * URL of Verida DID Server node to use.
	 */
	didServerUrl?: string;

	/**
	 * Specify custom schema paths (typicaly for local development).
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
	account: Account;
}

/**
 * Interface for DIDContextConfigs
 * key = contextName
 * value = SecureStorageContextConfig
 */
export interface DIDContextConfigs {
	[key: string]: Interfaces.SecureContextConfig;
}

/**
 * key = DID string
 * value = BaseStorageEngine
 */

/**
 * Interface for any DatabaseEngines
 */
export interface DatabaseEngines {
	[key: string]: BaseStorageEngine;
}

export interface FetchUriParams {
	did: string;
	contextHash: string;
	dbName: string;
	id: string;
	query: any;
}
