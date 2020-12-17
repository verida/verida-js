import { StorageConfig, StorageServerConfig } from '../interfaces'

// @todo: implement dataserver
export default class RemoteServer {

    private storageConfig: StorageConfig
    private serverConfig: StorageServerConfig

    constructor(storageConfig: StorageConfig, serverConfig: StorageServerConfig) {
        this.storageConfig = storageConfig
        this.serverConfig = serverConfig
    }

    public async openDatabase() {}

    

}