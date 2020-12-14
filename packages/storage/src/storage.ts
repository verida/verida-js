import StorageExternal from './storage-external'
import StorageConnection from './storage-connection'
import Keyring from './keyring'

export default class Storage extends StorageExternal {

    keyring?: Keyring

    constructor(did: string, storageName: string, connection: StorageConnection) {
        super(did, storageName, connection)
    }

    private async _init() {
        this.keyring = await this.connection.getKeyring(this.did, this.storageName)
    }

    
/*
    signData(data: object) (using the storage specific key)
    encryptData()
    decryptData()
    sharedKeyStart()
    sharedKeyEnd()
    setDataServer(uri)*/


}