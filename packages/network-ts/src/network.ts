import { AccountInterface } from '@verida/account'
import CeramicClient from '@ceramicnetwork/http-client'

import { ManagerConfig } from './interfaces'
import Context from './context/context'
import DIDContextManager from './did-context-manager'

const DEFAULT_CERAMIC_URL = 'http://localhost:7001/'

export default class Network {

    public ceramicUrl: string

    private ceramic: CeramicClient
    private didContextManager: DIDContextManager

    private account?: AccountInterface
    private did?: string

    constructor(config: ManagerConfig) {
        this.ceramicUrl = config.ceramicUrl ? config.ceramicUrl : DEFAULT_CERAMIC_URL
        this.ceramic = new CeramicClient(this.ceramicUrl)
        this.didContextManager = new DIDContextManager(this.ceramic, config.defaultStorageServer, config.defaultMessageServer)
    }

    /**
     * Connect a DID to this instance. Effectively sets the owner who can
     * then create storage contexts, authenticate with databases etc.
     * 
     * @param ceramic 
     */
    public async connect(account: AccountInterface) {
        this.account = account
        this.did = await this.account!.did()
        this.didContextManager.setAccount(this.account)   
    }

    public isConnected() {
        return this.did ? true : false
    }

    /**
     * Get a storage context for the current user
     */
    public async openContext(contextName: string, forceCreate: boolean = true): Promise<Context | undefined> {
        if (forceCreate) {
            if (!this.did || !this.account) {
                throw new Error('Unable to force create a storage context when not connected')
            }
        }

        const contextConfig = await this.didContextManager.getDIDContextConfig(this.did!, contextName, forceCreate)
        if (!contextConfig) {
            throw new Error ('Unable to locate requested storage context for this user. Force create?')
        }

        // @todo cache the storage contexts
        return new Context(contextName, this.didContextManager, this.account)
    }

}