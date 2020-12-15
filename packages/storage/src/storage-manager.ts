import Storage from './storage'
import StorageExternal from './storage-external'
import StorageConnection from './storage-connection'
import { StorageConnections } from './interfaces'

export class StorageManager {

    public didMethods: StorageConnections = {}
    public defaultServerUri: string
    public applicationUri: string

    constructor(connections: StorageConnection[], defaultServerUri: string, applicationUri: string) {
        this.defaultServerUri = defaultServerUri
        this.applicationUri = applicationUri

        connections.forEach(connection => {
            this.addProvider(connection)
        })
    }

    
    // Add a storage connection interface
    public addProvider(connection: StorageConnection) {
        this.didMethods[connection.didMethod] = connection
    }

    /**
     * Get a storage connection for the current user's DID
     */
    public async getStorage(did: string, storageName: string, authenticate: boolean): Promise<Storage> {
        const connection = this.findConnection(did)

        // did -> storage connection instance -> get() -- if fails, do link() -> create Storage
        const storageIndex = await connection.get(did, storageName)
        if (!storageIndex) {
            const storageConfig = {
                name: storageName,
                serverUri: this.defaultServerUri,
                applicationUri: this.applicationUri
            }

            const storageIndex = await connection.link(did, storageConfig)
        }

        const keyring = await connection.getKeyring(did, storageName)
        return new Storage(did, storageIndex!, keyring)
    }

    /**
     * Get a storage connection for an external DID
     * 
     * @param did 
     * @param storageName 
     */
    public async getStorageExternal(did: string, storageName: string): Promise<StorageExternal> {
        const connection = this.findConnection(did)

        // did -> storage connection instance -> get() -- if fails, throw error -> create StorageExternal
        const storageIndex = await connection.get(did, storageName)
        if (!storageIndex) {
            throw new Error(`Unable to locate DID document for ${did}`)
        }

        return new StorageExternal(did, storageIndex)
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