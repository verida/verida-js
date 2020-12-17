import { StorageIndex } from '../interfaces'
import RemoteServer from './remote-server'

/**
 * Storage for an external user
 */
export default class External {

    public storageIndex: StorageIndex
    public did: string

    constructor(did: string, storageIndex: StorageIndex) {
        this.storageIndex = storageIndex
        this.did = did
    }

    public getStorageServer(): RemoteServer {
        const storageConfig = {
            name: this.storageIndex.name,
            serverUri: this.storageIndex.serverUri
        }

        // @todo: pull anything relevant from datastore.js
        const serverConfig = {
        }

        return new RemoteServer(storageConfig, serverConfig)
    }

    /*
    publicKeys()
    //verifySignedData(data: object, sig: string)?
    */

}