import StorageConnection from './storage-connection'

export default class StorageExternal {

    connection: StorageConnection
    did: string
    storageName: string

    constructor(did: string, storageName: string, connection: StorageConnection) {
        this.connection = connection
        this.did = did
        this.storageName = storageName
    }

    /*
    getDataServer(): DataServer
    publicKeys()
    //verifySignedData(data: object, sig: string)?
    */

}