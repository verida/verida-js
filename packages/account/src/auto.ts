import CeramicClient from '@ceramicnetwork/http-client'
import { Interfaces, StorageLink } from '@verida/storage-link'
import { Keyring } from '@verida/keyring'

import AccountInterface from "./account-interface";

/**
 * An Authenticator that automatically signs everything
 */
export default class AutoAccount implements AccountInterface {

    ceramic: CeramicClient

    constructor(ceramic: CeramicClient) {
        this.ceramic = ceramic

        if (!ceramic.did) {
            throw new Error('Ceramic client is not authenticated with a valid DID')
        }
    }

    async keyring(contextName: string) {
        const consentMessage = `Do you wish to unlock this storage context: "${contextName}"?`
        const signature = await this.sign(consentMessage)
        return new Keyring(signature)
    }

    async sign(input: string): Promise<string> {
        const jws = await this.ceramic.did!.createJWS(input)
        return jws.signatures[0].signature
    }

    async did(): Promise<string> {
        return this.ceramic.did!.id
    }

    /**
     * Link storage to this user
     * 
     * @param storageConfig 
     */
     async linkStorage(storageConfig: Interfaces.SecureStorageContextConfig): Promise<void> {
         await StorageLink.setLink(this.ceramic, this.ceramic.did!.id, storageConfig)
     }

     /**
      * Unlink storage for this user
      * 
      * @param contextName 
      */
     async unlinkStorage(contextName: string): Promise<boolean> {
         return await StorageLink.unlink(this.ceramic, this.ceramic.did!.id, contextName)
     }

}