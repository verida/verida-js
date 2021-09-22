import Encryption from '@verida/encryption-utils'
const bs58 = require('bs58')
const _ = require('lodash')

import { Account } from '@verida/account'
import CeramicClient from '@ceramicnetwork/http-client'
import { Interfaces } from '@verida/storage-link'
import { Profile } from './context/profiles/profile'

import { ClientConfig } from './interfaces'
import Context from './context/context'
import DIDContextManager from './did-context-manager'
import Schema from './context/schema'
import DEFAULT_CONFIG from './config'

/**
 * A client connection to the Verida network
 */
export default class Client {

    /**
     * Connection URL to the ceramic network.
     * 
     * Defaults to Ceramic testnet. Specify custom URL via `ClientConfig` in the constructor.
     */
    public ceramicUrl: string

    private ceramic: CeramicClient
    private didContextManager: DIDContextManager

    private account?: Account
    private did?: string

    private environment: string
    private defaultContext?: Context

    /**
     * Create a client connection to the Verida network
     * 
     * @param userConfig ClientConfig Configuration for establishing a connection to the Verida network
     */
    constructor(userConfig: ClientConfig = {}) {
        this.environment = userConfig.environment ? userConfig.environment : DEFAULT_CONFIG.environment

        const defaultConfig = DEFAULT_CONFIG.environments[this.environment] ? DEFAULT_CONFIG.environments[this.environment] : {}
        const config = _.merge(defaultConfig, userConfig)

        this.ceramicUrl = config.ceramicUrl
        this.ceramic = new CeramicClient(this.ceramicUrl)
        this.didContextManager = new DIDContextManager(this.ceramic)
        Schema.setSchemaPaths(config.schemaPaths)
    }

    /**
     * Connect an Account to this client.
     * 
     * Sets the account owner who can then create storage contexts,
     * authenticate with databases, send messages etc.
     * 
     * @param account AccountInterface
     */
    public async connect(account: Account) {
        if (this.isConnected()) {
            throw new Error("Account is already connected.")
        }

        this.account = account
        this.did = await this.account!.did()
        this.didContextManager.setAccount(this.account)
    }

    /**
     * Check if an account is connected to this client.
     * 
     * @returns boolean True of an account is connected
     */
    public isConnected() {
        return typeof(this.account) != "undefined"
    }

    /**
     * Open a storage context for the current account.
     * 
     * @param contextName string Name of the `context` to open.
     * @param forceCreate boolean If the `context` doesn't already exist for the connected account, create it. Depending on the type of `Account` connected, this may open a prompt for the user to confirm (and sign).
     * @returns Context | undefined
     */
    public async openContext(contextName: string, forceCreate: boolean = true): Promise<Context | undefined> {
        if (forceCreate) {
            if (!this.account) {
                throw new Error('Unable to force create a storage context when not connected')
            }
        }

        let contextConfig
        if (!this.did) {
            // Attempt to fetch storage config from this account object if no DID specified
            // This is helpful in the account-web-vault that doesn't load the DID until it receives a request from the vault mobile app
            contextConfig = await this.account!.storageConfig(contextName, forceCreate)
            this.did = await this.account!.did()
        }

        if (!this.did) {
            throw new Error('No DID specified and no authenticated user')
        }

        if (!contextConfig) {
            contextConfig = await this.didContextManager.getDIDContextConfig(this.did!, contextName, forceCreate)
        }

        if (!contextConfig) {
            throw new Error ('Unable to locate requested storage context for requeseted DID. Force create?')
        }

        // @todo cache the storage contexts
        return new Context(this, contextName, this.didContextManager, this.account)
    }

    public async openExternalContext(contextName: string, did: string) {
        const contextConfig = await this.didContextManager.getDIDContextConfig(did, contextName, false)
        if (!contextConfig) {
            throw new Error ('Unable to locate requested storage context for requested DID.')
        }

        // @todo cache the storage contexts
        return new Context(this, contextName, this.didContextManager, this.account)
    }

    /**
     * Get the storage configuration of an application context for a given DID.
     * 
     * This provides the public details about the database, storage and messaging endpoints stored on Ceramic / IDX for the requested `did`.
     * 
     * @param did 
     * @param contextName 
     * @returns SecureContextConfig | undefined
     */
    public async getContextConfig(did: string, contextName: string): Promise<Interfaces.SecureContextConfig | undefined> {
        return this.didContextManager.getDIDContextConfig(did, contextName, false)
    }

    /**
     * Open the public profile of any user in read only mode.
     * 
     * Every application context has the ability to have it's own public profiles.
     * 
     * You most likely want to request the `Verida: Vault` context.
     * 
     * @param did 
     * @param contextName 
     * @returns <Profile | undefined>
     */
    public async openPublicProfile(did: string, contextName: string): Promise<Profile | undefined> {
        const context = await this.openExternalContext(contextName, did)
        if (!context) {
            throw new Error(`Account does not have a public profile for ${contextName}`)
        }

        return context!.openProfile("public", did, false)
    }

    /**
     * Get the valid data signatures for a given database record.
     * 
     * Iterates through all the signatures attached to a database record and validates each signature.
     * 
     * Only returns the signatures that are valid.
     * 
     * @param data A single database record
     * @param did An optional did to filter the results by
     * @returns string[] Array of DIDs that have validly signed the data
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

    /**
     * Get a Schama instance by URL.
     * 
     * @param schemaUri URL of the schema
     * @returns Schema A schema object
     */
    public async getSchema(schemaUri: string): Promise<Schema> {
        return Schema.getSchema(schemaUri)
    }

}