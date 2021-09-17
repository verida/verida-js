import CeramicClient from '@ceramicnetwork/http-client'
import { Account, AccountConfig } from '@verida/account'
import { Interfaces, StorageLink } from '@verida/storage-link'
import { Keyring } from '@verida/keyring'
import VaultModalLogin from './vault-modal-login'
const _ = require('lodash')
const store = require('store')

const VERIDA_USER_SIGNATURE = '_verida_auth_user_signature'

import { VaultModalLoginConfig } from "./interfaces"

const CONFIG_DEFAULTS = {
    loginUri: 'https://vault.verida.io/request',
    serverUri: 'wss://auth-server.testnet.verida.io:7002',
}

/**
 * An Authenticator that requests for authorization from the Vault
 */
export default class VaultAccount extends Account {
    private config: VaultModalLoginConfig

    private accountDid?: string
    private contextCache: any = {}

    constructor(loginConfig: VaultModalLoginConfig) {
        super()
        this.config = loginConfig
    }

    public async connectContext(contextName: string) {
        const vaultAccount = this
        const loginConfig = this.config
        const promise = new Promise<void>((resolve, reject) => {
            const cb = async (response: any) => {
                vaultAccount.setDid(response.did)
                vaultAccount.addContext(response.context, response.contextConfig, new Keyring(response.signature))

                if (typeof(config!.callback) === "function") {
                    config!.callback(response)
                }

                resolve()
            }

            const config: VaultModalLoginConfig = _.merge(CONFIG_DEFAULTS, loginConfig, {
                callback: cb
            })

            VaultModalLogin(contextName, config)
        })

        return promise
    }

    public async keyring(contextName: string): Promise<Keyring> {
        if (typeof(this.contextCache[contextName]) == 'undefined') {
            throw new Error(`Unable to connect to requested context: ${contextName}`)
        }

        return this.contextCache[contextName].keyring
    }

    public async addContext(contextName: string, contextConfig: Interfaces.SecureContextConfig, keyring: Keyring) {
        this.contextCache[contextName] = {
            keyring,
            contextConfig
        }
    }

    public async storageConfig(contextName: string, forceCreate: boolean = false): Promise<Interfaces.SecureContextConfig | undefined> {
        if (typeof(this.contextCache[contextName]) !== 'undefined') {
            return this.contextCache[contextName].contextConfig
        }

        if (forceCreate) {
            await this.connectContext(contextName)
            return this.storageConfig(contextName)
        }
    }

    public async sign(message: string): Promise<string> {
        throw new Error("Not implemented. Use `keyring()` instead.")
    }

    public async did(): Promise<string> {
        return this.accountDid!
    }

    public setDid(did: string) {
        this.accountDid = did
    }

    /**
     * Link storage to this user
     * 
     * @param storageConfig 
     */
     public async linkStorage(storageConfig: Interfaces.SecureContextConfig): Promise<void> {
        throw new Error("Link storage is not supported. Vault needs to have already created the storage.")
     }

     /**
      * Unlink storage for this user
      * 
      * @param contextName 
      */
    public async unlinkStorage(contextName: string): Promise<boolean> {
        throw new Error("Unlink storage is not supported. Request via the Vault.")
    }

    public async getCeramic(): Promise<CeramicClient> {
        throw new Error("Getting ceramic instance is not supported by Account Web Vault.")
    }

    public async disconnect(): Promise<void> {
        store.remove(VERIDA_USER_SIGNATURE)
    }

}