import { PermissionsConfig } from "./ContextInterfaces";

/**
 * Interface for DbRegistryEntryEncryptionKey
 */
export interface DbRegistryEntryEncryptionKey {
    key: string;
    type: string;
  }
  
/**
 * Interface for DbRegistryEntry
 */
export interface DbRegistryEntry {
dbHash: string;
dbName: string;
endpointType: string;
did: string;
contextName: string;
permissions: PermissionsConfig;
encryptionKey?: DbRegistryEntryEncryptionKey;
endpoint: string
}