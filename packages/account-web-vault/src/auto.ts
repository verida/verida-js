import CeramicClient from '@ceramicnetwork/http-client'
import { Interfaces, StorageLink } from '@verida/storage-link'
import { Utils } from '@verida/3id-utils-node'
import { Keyring } from '@verida/keyring'
import { AccountInterface } from "@verida/client-ts"

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

    private chain: string
    private privateKey: string
    private utils: Utils

    private ceramic?: CeramicClient

    constructor(chain: string, privateKey: string, ceramicUrl?: string) {
        this.utils = new Utils(ceramicUrl)
        this.chain = chain
        this.privateKey = privateKey
    }

    private async init() {
        if (this.ceramic) {
            return
        }

        this.ceramic = await this.utils.createAccount(this.chain, this.privateKey)

        if (!this.ceramic!.did) {
            throw new Error('Ceramic client is not authenticated with a valid DID')
        }
    }

    public async keyring(contextName: string) {
        await this.init()
        const did = await this.did()
        const consentMessage = `Do you wish to unlock this storage context: "${contextName}"?\n\n${did}`
        const signature = await this.sign(consentMessage)
        return new Keyring(signature)
    }

    // returns a compact JWS
    public async sign(message: string): Promise<string> {
        await this.init()
        const input = {
            message
        }
        const jws = await this.ceramic!.did!.createJWS(input)

        return fromDagJWS(jws)
    }

    public async did(): Promise<string> {
        await this.init()
        return this.ceramic!.did!.id
    }

    /**
     * Link storage to this user
     * 
     * @param storageConfig 
     */
     public async linkStorage(storageConfig: Interfaces.SecureContextConfig): Promise<void> {
        await this.init()
         await StorageLink.setLink(this.ceramic!, this.ceramic!.did!.id, storageConfig)
     }

     /**
      * Unlink storage for this user
      * 
      * @param contextName 
      */
    public async unlinkStorage(contextName: string): Promise<boolean> {
        await this.init()
        return await StorageLink.unlink(this.ceramic!, this.ceramic!.did!.id, contextName)
    }

    public async getCeramic(): Promise<CeramicClient> {
        await this.init()
        return this.ceramic!
    }

}