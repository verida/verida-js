
import { ConnectionConfig, StorageConfig } from './interfaces'

/**
 * An abstract class representing a connection between a DID and a storage configuration
 */
export default abstract class StorageConnection {

    /**
     * Name of this DID method (ie: `ethr`)
     */
    public abstract didMethod: string

    constructor(config?: ConnectionConfig) {}

    /**
     * Get a StorageConfig instance from a DID and storage name
     * 
     * @param did 
     * @param storageName 
     */
    public abstract get(did: string, storageName: string): Promise<StorageConfig>

    /**
     * Link a DID and storage name to a given storage configuration
     * 
     * @param did 
     * @param storageName 
     * @param storageConfig 
     */
    public abstract link(did: string, storageName: string, storageConfig: StorageConfig): Promise<boolean>

    /**
     * Sign data as the currently authenticated DID
     * 
     * @param data 
     */
    public abstract sign(data: object): Promise<string>

    /**
     * Authenticate a DID using this current DID method
     * 
     * @param config 
     */
    public abstract authenticate(config: any): Promise<boolean>

}