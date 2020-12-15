import Server from './server'
import External from './external'
import { StorageIndex } from '../interfaces'
import Keyring from '../utils/keyring'

/**
 * Storage for an authenticated user
 */
export default class Storage extends External {

    public keyring: Keyring

    constructor(did: string, storageIndex: StorageIndex, keyring: Keyring) {
        super(did, storageIndex)
        this.keyring = keyring
    }

    public getStorageServer(): Server {
        const storageConfig = {
            name: this.storageIndex.name,
            serverUri: this.storageIndex.serverUri
        }

        // @todo: pull anything relevant from datastore.js
        const serverConfig = {
            keyring: this.keyring
        }

        return new Server(storageConfig, serverConfig)
    }

    public setStorageServer(uri: string) {
        //@todo
    }

}