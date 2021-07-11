import { Interfaces } from '@verida/storage-link'
import { DID } from 'dids'

/**
 * Class representing the connection between a DID and secure storage
 */
export default class StorageConnection {

    private storageConfig: Interfaces.SecureStorageContextConfig
    private did: DID

    constructor(storageConfig: Interfaces.SecureStorageContextConfig, did: DID) {
        this.storageConfig = storageConfig
        this.did = did
    }

    /**
     * Get a serve connection instance
     * @todo
     */
    public getServer() {

    }

}