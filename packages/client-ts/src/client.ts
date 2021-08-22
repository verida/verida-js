import Encryption from '@verida/encryption-utils'
const bs58 = require('bs58')
const _ = require('lodash')

import { AccountInterface } from '@verida/account'
import CeramicClient from '@ceramicnetwork/http-client'

import { ManagerConfig } from './interfaces'
import Context from './context/context'
import DIDContextManager from './did-context-manager'
import Schema from './context/schema'
import DEFAULT_CONFIG from './config'

export default class Client {

    public ceramicUrl: string

    private ceramic: CeramicClient
    private didContextManager: DIDContextManager

    private account?: AccountInterface
    private did?: string

    private environment: string

    constructor(userConfig: ManagerConfig) {
        this.environment = userConfig.environment ? userConfig.environment : DEFAULT_CONFIG.environment

        const defaultConfig = DEFAULT_CONFIG.environments[this.environment] ? DEFAULT_CONFIG.environments[this.environment] : {}
        const config = _.merge(defaultConfig, userConfig)

        this.ceramicUrl = config.ceramicUrl
        this.ceramic = new CeramicClient(this.ceramicUrl)
        this.didContextManager = new DIDContextManager(this.ceramic, config.defaultDatabaseServer, config.defaultMessageServer, config.defaultStorageServer)
        Schema.setSchemaPaths(config.schemaPaths)
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

    /**
     * Verify data has been signed by a particular DID
     * 
     * @param did 
     * @param signatures 
     */
     public async getValidDataSignatures(data: any, did?: string): Promise<string[]> {
        if (!data.signatures) {
            // no signatures
            return []
        }

        let _data = _.merge({}, data)
        delete _data['signatures']
        delete _data['_rev']

        let validSignatures = []
        for (let key in data.signatures) {
            const sigKeyParts = key.split(':')
            if (sigKeyParts.length < 4) {
                // invalid sig, skip
                continue
            }

            const sigDid = `did:${sigKeyParts[1]}:${sigKeyParts[2]}`
            const contextHash = sigKeyParts[3]
            if (!did || sigDid == did) {
                const signature = data.signatures[key]
                const contextConfig = await this.didContextManager.getDIDContextHashConfig(sigDid, contextHash)
                const signKeyBase58 = contextConfig.publicKeys.signKey.base58
                const signKey = bs58.decode(signKeyBase58)
                const validSig = await Encryption.verifySig(_data, signature, signKey)
                if (validSig) {
                    validSignatures.push(sigDid)
                }
            }
        }

        return validSignatures
    }

}