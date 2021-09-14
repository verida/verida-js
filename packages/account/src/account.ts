import { Keyring } from '@verida/keyring'
import { Interfaces } from '@verida/storage-link'
import { createJWT, EdDSASigner } from 'did-jwt'
import { encodeBase64 } from "tweetnacl-util"

const _ = require('lodash')

/**
 * An Authenticator that automatically signs everything
 */
export default class Account {


    constructor() {
    }

    /**
     * Generate a keyring for this user for a given storage context.
     * 
     * @param contextName 
     */
    keyring(contextName: string): Promise<Keyring> {
        throw new Error("Not implemented")
    }

     /**
      * Sign a string as the current user
      * 
      * @param input 
      */
    sign(input: string): Promise<string> {
        throw new Error("Not implemented")
    }
 
     /**
      * Get the DID of the current user
      */
    did(): Promise<string> {
        throw new Error("Not implemented")
    }
 
     /**
      * Link storage to this user
      * 
      * @param storageConfig 
      */
    linkStorage(storageConfig: Interfaces.SecureContextConfig): Promise<void> {
        throw new Error("Not implemented")
    }
 
     /**
      * Unlink storage for this user
      * 
      * @param contextName 
      */
    unlinkStorage(contextName: string): Promise<boolean> {
        throw new Error("Not implemented")
    }

    /**
     * Create a DID-JWT from a data object
     * @param {*} data 
     */
     public async createDidJwt(contextName: string, data: object, config: any = {}): Promise<string> {
        config = _.merge({
            expiry: null,
            insertedAt: (new Date()).toISOString()
        }, config)

        const keyring = await this.keyring(contextName)
        const keys = await keyring.getKeys()
        const privateKey = encodeBase64(keys.signPrivateKey)
        const signer = EdDSASigner(privateKey)
        const did = await this.did()

        const jwt = await createJWT({
            aud: did,
            exp: config.expiry,
            data: data,
            context: contextName,
            insertedAt: config.insertedAt
        }, {
            alg: 'Ed25519',
            issuer: did,
            signer
        })

        return jwt
    }
}