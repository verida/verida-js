
import { StorageProviderConfig, StorageConfig } from './interfaces'

/**
 * An abstract class representing a storage provider
 */
export default abstract class StorageProvider {

    abstract didMethod: string

    constructor(config?: StorageProviderConfig) {}

    abstract async get(did: string, storageName: string): Promise<StorageConfig>
    abstract async save(did: string, storageName: string, storageConfig: StorageConfig): Promise<boolean>
    abstract async sign(data: object): Promise<string>

}