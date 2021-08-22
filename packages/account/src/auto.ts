import CeramicClient from '@ceramicnetwork/http-client'
import { Interfaces, StorageLink } from '@verida/storage-link'
import { Keyring } from '@verida/keyring'

import AccountInterface from "./account-interface"
import { DagJWS } from 'dids'

// Pulled from https://github.com/ceramicnetwork/js-did/blob/bc5271f7e659d073e150389828c021156a80e6d0/src/utils.ts#L29
function fromDagJWS(jws: DagJWS): string {
    if (jws.signatures.length > 1) throw new Error('Cant convert to compact jws')
    return `${jws.signatures[0].protected}.${jws.payload}.${jws.signatures[0].signature}`
}

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

    public async keyring(contextName: string) {
        const did = await this.did()
        const consentMessage = `Do you wish to unlock this storage context: "${contextName}"?\n\n${did}`
        const signature = await this.sign(consentMessage)
        return new Keyring(signature)
    }

    // returns a compact JWS
    public async sign(message: string): Promise<string> {
        const input = {
            message
        }
        const jws = await this.ceramic.did!.createJWS(input)

        return fromDagJWS(jws)
    }

    public async did(): Promise<string> {
        return this.ceramic.did!.id
    }

    /**
     * Link storage to this user
     * 
     * @param storageConfig 
     */
     public async linkStorage(storageConfig: Interfaces.SecureContextConfig): Promise<void> {
         await StorageLink.setLink(this.ceramic, this.ceramic.did!.id, storageConfig)
     }

     /**
      * Unlink storage for this user
      * 
      * @param contextName 
      */
      public async unlinkStorage(contextName: string): Promise<boolean> {
         return await StorageLink.unlink(this.ceramic, this.ceramic.did!.id, contextName)
     }

}