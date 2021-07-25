import { DIDContextConfigs } from './interfaces'
import { AccountInterface } from '@verida/account'
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

    private defaultStorageServer: Interfaces.SecureStorageServer
    private defaultMessageServer: Interfaces.SecureStorageServer
    private ceramic: CeramicClient
    private account?: AccountInterface

    public constructor(ceramic: CeramicClient, defaultStorageServer: Interfaces.SecureStorageServer, defaultMessageServer: Interfaces.SecureStorageServer) {
        this.ceramic = ceramic
        this.defaultStorageServer = defaultStorageServer
        this.defaultMessageServer = defaultMessageServer
    }

    public setAccount(account: AccountInterface) {
        this.account = account
    }

    public async getContextStorageServer(did: string, contextName: string, forceCreate: boolean = true): Promise<Interfaces.SecureStorageServer> {
        const storageConfig = await this.getDIDContextConfig(did, contextName, forceCreate)
        return storageConfig.services.storageServer
    }

    public async getContextMessageServer(did: string, contextName: string, forceCreate: boolean = true): Promise<Interfaces.SecureStorageServer> {
        const storageConfig = await this.getDIDContextConfig(did, contextName, forceCreate)
        return storageConfig.services.messageServer
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

    public async getDIDContextConfig(did: string, contextName: string, forceCreate: boolean = true): Promise<Interfaces.SecureStorageContextConfig> {
        const contextHash = StorageLink.hash(`${did}/${contextName}`)

        if (this.didContexts[contextHash]) {
            return this.didContexts[contextHash]
        }

        let storageConfig = await StorageLink.getLink(this.ceramic, did, contextName)

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

            // Force creation of storage context using default server configurations
            storageConfig = await DIDStorageConfig.generate(this.account, contextName, {
                storageServer: this.defaultStorageServer,
                messageServer: this.defaultMessageServer
            })

            await this.account!.linkStorage(storageConfig)
        }

        this.didContexts[contextHash] = storageConfig
        return storageConfig
    }
    
}
