import { Account } from '@verida/account'
import { Interfaces } from '@verida/storage-link'
import { Keyring } from '@verida/keyring'
import VaultModalLogin from './vault-modal-login'
const _ = require('lodash')
const store = require('store')
const VERIDA_AUTH_CONTEXT = '_verida_auth_context'

import { VaultAccountConfig, VaultModalLoginConfig } from "./interfaces"

const CONFIG_DEFAULTS = {
    loginUri: 'https://vault.verida.io/request',
    serverUri: 'wss://auth-server.testnet.verida.io:7002',
}

export const hasSession = (contextName: string): boolean => {
    const storedSessions = store.get(VERIDA_AUTH_CONTEXT)

    if (!storedSessions || !storedSessions[contextName]) {
        return false
    } else {
        return true
    }
}

/**
 * An Authenticator that requests for authorization from the Vault
 */
export default class VaultAccount extends Account {
    private config: VaultAccountConfig

    private accountDid?: string
    private contextCache: any = {}

    constructor(config: VaultAccountConfig) {
        super()
        this.config = config
        if (!this.config.vaultConfig) {
            this.config.vaultConfig = {}
        }
    }

    public async connectContext(contextName: string) {
        const vaultAccount = this
        const loginConfig = this.config

        const contextConfig = await this.loadFromSession(contextName)
        if (contextConfig) {
            return contextConfig
        }

        const promise = new Promise<boolean>((resolve, reject) => {
            const cb = async (response: any, saveSession: boolean) => {
                if (saveSession) {
                    let storedSessions = store.get(VERIDA_AUTH_CONTEXT)
                    if (!storedSessions) {
                        storedSessions = {}
                    }

                    storedSessions[contextName] = response
                    store.set(VERIDA_AUTH_CONTEXT, storedSessions)
                }

                this.setDid(response.did)
                vaultAccount.addContext(response.context, response.contextConfig, new Keyring(response.signature))
                resolve(true)
            }

            const config: VaultModalLoginConfig = _.merge(CONFIG_DEFAULTS, this.config.vaultConfig, {
                callback: cb,
                callbackRejected: function() {
                    resolve(false)
                }
            })

            VaultModalLogin(contextName, config)
        })

        return promise
    }

    public async loadFromSession(contextName: string): Promise<Interfaces.SecureContextConfig | undefined> {
        const storedSessions = store.get(VERIDA_AUTH_CONTEXT)

        if (!storedSessions || !storedSessions[contextName]) {
            return
        }

        const response = storedSessions[contextName]

        this.setDid(response.did)
        this.addContext(response.context, response.contextConfig, new Keyring(response.signature))

        if (typeof(this.config.vaultConfig!.callback) === "function") {
            this.config.vaultConfig!.callback(response)
        }

        return response.contextConfig
    }

    public async keyring(contextName: string): Promise<Keyring> {
        if (typeof(this.contextCache[contextName]) == 'undefined') {
            throw new Error(`Unable to connect to requested context: ${contextName}`)
        }

        return this.contextCache[contextName].keyring
    }

    public addContext(contextName: string, contextConfig: Interfaces.SecureContextConfig, keyring: Keyring) {
        this.contextCache[contextName] = {
            keyring,
            contextConfig
        }
    }

    public async storageConfig(contextName: string, forceCreate: boolean = false): Promise<Interfaces.SecureContextConfig | undefined> {
        if (this.contextCache[contextName]) {
            return this.contextCache[contextName].contextConfig
        }

        if (forceCreate) {
            await this.connectContext(contextName)

            if (this.contextCache[contextName]) {
                return this.contextCache[contextName].contextConfig
            }
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

    public async disconnect(contextName?: string): Promise<void> {
        // @todo, support logging out just one
        store.remove(VERIDA_AUTH_CONTEXT)
    }

}