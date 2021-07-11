
import { Interfaces } from '@verida/storage-link'

import BaseStorageEngine from './engines/base'

/**
 * Storage for an external user
 */
export default class BaseStorage {

    public storageConfig: Interfaces.SecureStorageContextConfig
    
    protected storageEngine?: BaseStorageEngine
    protected messageEngine?: BaseStorageEngine

    constructor(storageConfig: Interfaces.SecureStorageContextConfig) {
        this.storageConfig = storageConfig
    }

    public async getStorage(): Promise<BaseStorageEngine> {
        throw new Error('Not implemented')
    }

    /*
     * @todo: create and use ./messaging/
    public async getMessaging(): Promise<BaseStorageEngine> {
        if (this.messageEngine) {
            return this.messageEngine
        }

        const engineType = this.storageConfig.services.messageServer.type

        if (!STORAGE_ENGINES[engineType]) {
            throw new Error(`Unsupported message engine type specified: ${engineType}`)
        }

        this.messageEngine = new engineType(this.storageConfig.id, this.storageConfig.services.messageServer.endpointUri)
        return this.messageEngine!
    }*/

}