import StorageServer from './storage-server'
import StorageExternal from './storage-external'
import { StorageIndex } from './interfaces'
import Keyring from './keyring'

/**
 * Storage for an authenticated user
 */
export default class Storage extends StorageExternal {

    public keyring: Keyring

    constructor(did: string, storageIndex: StorageIndex, keyring: Keyring) {
        super(did, storageIndex)
        this.keyring = keyring
    }

    public getStorageServer(): StorageServer {
        const storageConfig = {
            name: this.storageIndex.name,
            serverUri: this.storageIndex.serverUri
        }

        // @todo: pull anything relevant from datastore.js
        const serverConfig = {
            keyring: this.keyring
        }

        return new StorageServer(storageConfig, serverConfig)
    }

    public setStorageServer(uri: string) {
        //@todo
    }

}