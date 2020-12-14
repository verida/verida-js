import Storage from './storage'
import StorageExternal from './storage-external'
import StorageConnection from './storage-connection'
import { StorageConnections } from './interfaces'

export class StorageManager {

    public didMethods: StorageConnections = {}

    constructor(connections: StorageConnection[]) {
        connections.forEach(connection => {
            this.addProvider(connection)
        })
    }

    
    // Add a storage connection interface
    public addProvider(connection: StorageConnection) {
        this.didMethods[connection.didMethod] = connection
    }

    /**
     * Get a storage connection for a given DID
     * provider.get() to obtain StorageConfig
        IF authenticate = true
        provider.sign() consent message to obtain private key for storage
        Generate and return Storage
        ELSE return StorageExternal
        //  <Storage | StorageExternal>
    */
    public async getStorage(did: string, storageName: string, authenticate: boolean): Promise<Storage> {
        const connection = this.findConnection(did)

        return new Storage(did, storageName, connection)
    }

    public async getStorageExternal(did: string, storageName: string): Promise<StorageExternal> {
        const connection = this.findConnection(did)
        return new StorageExternal(did, storageName, connection)
    }
    
    /**
     * Save the storage config
     * 
     * Deterministically generate authKeys & publicKeys using provider.sign() to generate StorageConfig instance
     * [storage connection].save()
     * Generate and return Storage
     * 
     */
    //saveStorage(did: string, storageName: string, databaseUri: string, applicationUri: string) <Storage>

    private findConnection(did: string): StorageConnection {
        const parts = did.split(':')
        if (parts.length < 3) {
            throw new Error('Invalid DID provided')
        }

        const didMethod = parts[1]
        if (!this.didMethods[didMethod]) {
            throw new Error(`DID method (${didMethod}) not supported`)
        }
        
        return this.didMethods[didMethod]
    }
    

}