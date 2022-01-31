import { Context } from "..";

/**
 * Interface for any DatabaseOpenConfig
 */
export interface DatabaseOpenConfig {
  /**
   * Specify the permissions to use when opening this database.
   */
  permissions?: PermissionsConfig;

  /**
   * Specify the DID that owns the database.
   *
   * This ensures the Verida client connects to the correct database server hosting the data for the specified `did`.
   */
  did?: string;

  /**
   * Specify a specific database connection string to use when opening the database.
   */
  dsn?: string;

  /**
   * Save this database into the user's master list of opened databases.
   */
  saveDatabase?: boolean;

  /**
   * Open the database in read-only mode.
   *
   * This is useful when opening a database owned by an external `did` where the current authenticated account has no write access.
   */
  readOnly?: boolean;

  /**
   * Boolean indicating if it's expected the current connected account is the owner of this database.
   */
  isOwner?: boolean;

  /**
   * An optional encryption key to use for encyrpting / decrypting data.
   *
   * This encryption key will not apply if the database is marked as `public`.
   */
  encryptionKey?: string;

  /**
   * Create an application context if it doesn't already exist for the connected account.
   */
  createContext?: boolean;

  /**
   * Optionally specify an external context to open
   */
  contextName?: string;

  /**
   * Optionally specify the context used to sign data
   */
  signingContext?: Context;
}

// @todo: Same as DatabaseOpenConfig

/**
 * Interface for any DatastoreOpenConfig
 */

export interface DatastoreOpenConfig {
  permissions?: PermissionsConfig;
  did?: string;
  saveDatabase?: boolean;
  readOnly?: boolean;
  encryptionKey?: string;
  databaseName?: string;
  createContext?: boolean;
  external?: boolean;
  contextName?: string;
}

/**
 * Interface for any MessagesConfig
 */
export interface MessagesConfig {
  maxItems?: Number;
}

/**
 * Interface for any StorageEngineTypes
 */
export interface StorageEngineTypes {
  [key: string]: any;
}

/**
 * Interface for any PermissionsConfig
 */
export interface PermissionsConfig {
  read: PermissionOptionsEnum;
  write: PermissionOptionsEnum;
  readList?: string[];
  writeList?: string[];
}

export enum PermissionOptionsEnum {
  OWNER = "owner",
  PUBLIC = "public",
  USERS = "users",
}

/**
 * Interface for any MessageSendConfig
 */
export interface MessageSendConfig {
  did: string,
  expiry?: Number;
  recipientContextName?: string;
}
