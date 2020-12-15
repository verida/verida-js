import { StorageIndex } from './interfaces'
import StorageServer from './storage-server'

/**
 * Storage for an external user
 */
export default class StorageExternal {

    storageIndex: StorageIndex
    did: string

    constructor(did: string, storageIndex: StorageIndex) {
        this.storageIndex = storageIndex
        this.did = did
    }

    public getStorageServer(): StorageServer {
        const storageConfig = {
            name: this.storageIndex.name,
            serverUri: this.storageIndex.serverUri
        }

        // @todo: pull anything relevant from datastore.js
        const serverConfig = {
        }

        return new StorageServer(storageConfig, serverConfig)
    }

    /*
    publicKeys()
    //verifySignedData(data: object, sig: string)?
    */

}