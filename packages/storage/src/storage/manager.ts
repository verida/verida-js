import Storage from './storage'
import External from './external'
import DIDConnection from './did-connection'
import { StorageConnections } from '../interfaces'

export default class Manager {

    public didMethods: StorageConnections = {}
    public defaultServerUri: string
    public applicationUri: string

    constructor(connections: DIDConnection[], defaultServerUri: string, applicationUri: string) {
        this.defaultServerUri = defaultServerUri
        this.applicationUri = applicationUri

        connections.forEach(connection => {
            this.addProvider(connection)
        })
    }

    
    // Add a storage connection interface
    public addProvider(connection: DIDConnection) {
        this.didMethods[connection.didMethod] = connection
    }

    /**
     * Get a storage connection for the current user's DID
     */
    public async openStorage(did: string, storageName: string, forceCreate: boolean): Promise<Storage | undefined> {
        const connection = this.findConnection(did)

        // did -> storage connection instance -> get() -- if fails, do link() -> create Storage
        const storageIndex = await connection.get(did, storageName)
        if (!storageIndex) {
            if (forceCreate) {
                const storageConfig = {
                    name: storageName,
                    serverUri: this.defaultServerUri,
                    applicationUri: this.applicationUri
                }

                const storageIndex = await connection.link(did, storageConfig)
            }
            else {
                return
            }
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
    public async openStorageExternal(did: string, storageName: string): Promise<External | undefined> {
        const connection = this.findConnection(did)

        // did -> storage connection instance -> get() -- if fails, throw error -> create StorageExternal
        const storageIndex = await connection.get(did, storageName)
        if (!storageIndex) {
            return
        }

        return new External(did, storageIndex)
    }

    private findConnection(did: string): DIDConnection {
        const parts = did.split(':')
        if (parts.length < 3 || parts[2].length != 42) {
            throw new Error('Invalid DID provided')
        }

        const didMethod = parts[1]
        if (!this.didMethods[didMethod]) {
            throw new Error(`DID method (${didMethod}) not supported`)
        }

        
        return this.didMethods[didMethod]
    }

}