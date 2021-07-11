import BaseStorage from './base'

import BaseStorageEngine from './engines/base'
import StorageEngineVerida from './engines/verida/engine'
import { StorageEngineTypes } from './interfaces'

// @todo: make extendable
const STORAGE_ENGINES: StorageEngineTypes = {
    'Verida': typeof StorageEngineVerida
}

/**
 * Storage for an external user
 */
export default class ExternalStorage extends BaseStorage {

    public async getStorage(): Promise<BaseStorageEngine> {
        if (this.storageEngine) {
            return this.storageEngine
        }

        const engineType = this.storageConfig.services.storageServer.type

        if (!STORAGE_ENGINES[engineType]) {
            throw new Error(`Unsupported storage engine type specified: ${engineType}`)
        }
        const engine = STORAGE_ENGINES[engineType]  // @todo type cast correctly

        this.storageEngine = new engine(this.storageConfig.id, this.storageConfig.services.storageServer.endpointUri)
        return this.storageEngine!
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