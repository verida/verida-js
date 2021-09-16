import { DIDContextConfigs } from './interfaces'
import { Account } from '@verida/account'
import { StorageLink, DIDStorageConfig } from '@verida/storage-link'

import CeramicClient from '@ceramicnetwork/http-client'
import { Interfaces } from '@verida/storage-link'

/**
 * Manage all the available storage contexts for all the DIDs being requested,
 * 
 * Can force creating a new storage context for the authenticated account. 
 */
export default class DIDContextManager {

    private didContexts: DIDContextConfigs = {}

    private ceramic: CeramicClient
    private account?: Account

    public constructor(ceramic: CeramicClient) {
        this.ceramic = ceramic
    }

    public setAccount(account: Account) {
        this.account = account
    }

    public async getContextDatabaseServer(did: string, contextName: string, forceCreate: boolean = true): Promise<Interfaces.SecureContextEndpoint> {
        const contextConfig = await this.getDIDContextConfig(did, contextName, forceCreate)
        return contextConfig.services.databaseServer
    }

    public async getContextStorageServer(did: string, contextName: string, forceCreate: boolean = true): Promise<Interfaces.SecureContextEndpoint> {
        const contextConfig = await this.getDIDContextConfig(did, contextName, forceCreate)
        if (!contextConfig.services.storageServer) {
            throw new Error('Storage server not specified')
        }

        return contextConfig.services.storageServer
    }

    public async getContextMessageServer(did: string, contextName: string, forceCreate: boolean = true): Promise<Interfaces.SecureContextEndpoint> {
        const contextConfig = await this.getDIDContextConfig(did, contextName, forceCreate)
        return contextConfig.services.messageServer
    }

    public async getDIDContextHashConfig(did: string, contextHash: string) {
        if (this.didContexts[contextHash]) {
            return this.didContexts[contextHash]
        }

        let storageConfig = await StorageLink.getLink(this.ceramic, did, contextHash, false)
        if (!storageConfig) {
            throw new Error('Unable to locate requested storage context for this user')
        }

        this.didContexts[contextHash] = storageConfig
        return storageConfig
    }

    public async getDIDContextConfig(did: string, contextName: string, forceCreate?: boolean): Promise<Interfaces.SecureContextConfig> {
        const contextHash = StorageLink.hash(`${did}/${contextName}`)

        if (this.didContexts[contextHash]) {
            return this.didContexts[contextHash]
        }

        let storageConfig
        // Fetch the storage config from our account object if it matches the requested DID
        if (this.account) {
            const accountDid = await this.account.did()
            if (accountDid == did) {
                storageConfig = await this.account.storageConfig(contextName, forceCreate)
            }
        }
        
        if (!storageConfig) {
            storageConfig = await StorageLink.getLink(this.ceramic, did, contextName, true)
        }

        if (!storageConfig) {
            if (forceCreate) {
                throw new Error('Unable to force creation of storage context for this DID')
            }
            else {
                throw new Error('Unable to locate requested storage context for this DID -- Storage context doesn\'t exist (try force create?)')
            }
        }

        this.didContexts[contextHash] = storageConfig
        return storageConfig
    }
    
}
