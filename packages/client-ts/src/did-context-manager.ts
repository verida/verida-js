import { DIDContextConfigs } from './interfaces'
import AccountInterface from './account-interface'
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

    private defaultDatabaseServer: Interfaces.SecureContextEndpoint
    private defaultMessageServer: Interfaces.SecureContextEndpoint
    private defaultStorageServer?: Interfaces.SecureContextEndpoint

    private ceramic: CeramicClient
    private account?: AccountInterface

    public constructor(ceramic: CeramicClient, defaultDatabaseServer: Interfaces.SecureContextEndpoint, defaultMessageServer: Interfaces.SecureContextEndpoint, defaultStorageServer?: Interfaces.SecureContextEndpoint) {
        this.ceramic = ceramic
        this.defaultDatabaseServer = defaultDatabaseServer
        this.defaultStorageServer = defaultStorageServer
        this.defaultMessageServer = defaultMessageServer
    }

    public setAccount(account: AccountInterface) {
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

        let storageConfig = await StorageLink.getLink(this.ceramic, did, contextName, true)

        if (!storageConfig) {
            if (!forceCreate) {
                throw new Error('Unable to locate requested storage context for this user -- Storage context doesn\'t exist (try force create?)')
            }

            if (!this.account) {
                throw new Error('Unable to locate requested storage context for this user -- Not authenticated')
            }

            const accountDid = await this.account!.did()

            if (accountDid != did) {
                throw new Error('Unable to create storage context for a different DID than the one authenticated')
            }

            const endpoints: Interfaces.SecureContextServices = {
                databaseServer: this.defaultDatabaseServer,
                messageServer: this.defaultMessageServer
            }

            if (this.defaultStorageServer) {
                endpoints.storageServer = this.defaultStorageServer
            }

            // Force creation of storage context using default server configurations
            storageConfig = await DIDStorageConfig.generate(this.account, contextName, endpoints)

            await this.account!.linkStorage(storageConfig)
        }

        this.didContexts[contextHash] = storageConfig
        return storageConfig
    }
    
}
