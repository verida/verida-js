
import StorageProvider from './storage-provider'
import Storage from './storage'
import StorageExternal from './storage-external'
//import { StorageProviderConfig } from './interfaces'

export default class StorageManager {

    private providers = []

    constructor(providers?: StorageProvider[]) {
        // Load initial providers
        if (providers) {
            providers.forEach(provider => {
                this.addProvider(provider)
            })
        }
    }

    addProvider(provider: StorageProvider) {
        this.providers[provider.didMethod] = provider
    }

    /**
     * provider.get() to obtain StorageConfig
    IF authenticate = true
    provider.sign() consent message to obtain private key for storage
    Generate and return Storage
    ELSE return StorageExternal
     * @param did 
     * @param storageName 
     * @param authenticate 
     */
    async get(did: string, storageName: string, authenticate: boolean): Promise<Storage | StorageExternal> {
        const didMethod = 'ethr'
        if (!this.providers[didMethod]) {
            throw Error(`No DID storage provider exist for DID method ${didMethod}`)
        }

        return new Storage()
    }

    /**
     * Deterministically generate authKeys & publicKeys using provider.sign() to generate StorageConfig instance
    provider.save()
    Generate and return Storage
     */
    async save(did: string, storageName: string, databaseUri: string, applicationUri: string): Promise<Storage> {
        return new Storage()
    }
    


}