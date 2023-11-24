import { Keyring } from '@verida/keyring'
import { AccountConfig, AuthContext, AuthTypeConfig, IAccount, SecureContextConfig } from '@verida/types'
import { createJWT, ES256KSigner } from 'did-jwt'

const _ = require('lodash')

/**
 * An Authenticator that automatically signs everything
 */
export default class Account implements IAccount {

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
    linkStorage(storageConfig: SecureContextConfig): Promise<boolean> {
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

    storageConfig(contextName: string, forceCreate: boolean = false): Promise<SecureContextConfig | undefined> {
        throw new Error("Not implemented")
    }

    linkStorageContextService(contextName: string, endpointType: string, serverType: string, endpointUris: string[]): Promise<boolean> {
        throw new Error("Not implemented")
    }

    public setAccountConfig(accountConfig: AccountConfig) {
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
        const signer = ES256KSigner(keys.signPrivateKey)
        const did = await this.did()

        const jwt = await createJWT({
            aud: did,
            exp: config.expiry,
            data: data,
            context: contextName,
            insertedAt: config.insertedAt
        }, {
            alg: 'ES256K',
            issuer: did,
            signer
        })

        return jwt
    }

    /**
     * An optional method that can be used to disconnect the current user.
     * 
     * For example, in a web browser context, it would remove any stored signatures from local storage.
     */
    public async disconnect(contextName?: string): Promise<void> {
        return
    }

    public async getAuthContext(contextName: string, contextConfig: SecureContextConfig, authConfig: AuthTypeConfig = {
        force: false
    }, authType: string = "database"): Promise<AuthContext> {
        throw new Error("Not implemented.")
    }

    public async disconnectDevice(contextName: string, deviceId: string="Test device"): Promise<boolean> {
        throw new Error("Not implemented.")
    }

}