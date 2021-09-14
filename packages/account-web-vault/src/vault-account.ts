import CeramicClient from '@ceramicnetwork/http-client'
import { Account } from '@verida/account'
import { Interfaces } from '@verida/storage-link'
import { Keyring } from '@verida/keyring'
import VaultModalLogin from './vault-modal-login'
import { DagJWS } from 'dids'
const _ = require('lodash')

import { VaultAccountConfig, VaultModalLoginConfig } from "./interfaces"

// Pulled from https://github.com/ceramicnetwork/js-did/blob/bc5271f7e659d073e150389828c021156a80e6d0/src/utils.ts#L29
function fromDagJWS(jws: DagJWS): string {
    if (jws.signatures.length > 1) throw new Error('Cant convert to compact jws')
    return `${jws.signatures[0].protected}.${jws.payload}.${jws.signatures[0].signature}`
}

const CONFIG_DEFAULTS = {
    loginUri: 'https://vault.verida.io/request',
    serverUri: 'wss://auth-server.testnet.verida.io:7001',
}

/**
 * An Authenticator that requests for authorization from the Vault
 */
export default class VaultAccount extends Account {
    private config: VaultAccountConfig

    private accountDid?: string

    constructor(config: VaultAccountConfig) {
        super()
        this.config = _.merge({
            vaultConfig: {}
        }, config)
    }

    public async keyring(contextName: string): Promise<Keyring> {
        const vaultAccount = this
        const promise = new Promise<Keyring>((resolve, reject) => {
            const vaultConfig = this.config.vaultConfig
            const cb = async (response: any) => {
                vaultAccount.setDid(response.did)

                if (typeof(vaultConfig!.callback) === "function") {
                    vaultConfig!.callback(response)
                }

                resolve(new Keyring(response.signature))
            }

            const config: VaultModalLoginConfig = _.merge(CONFIG_DEFAULTS, this.config.vaultConfig, {
                callback: cb
            })

            VaultModalLogin(contextName, config)
        })

        return promise
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

}