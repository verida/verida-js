import { Interfaces, StorageLink } from '@verida/storage-link'
import { Keyring } from '@verida/keyring'
import { AccountInterface } from "@verida/client-ts"
const _ = require('lodash')

import { EthereumAuthProvider, ThreeIdConnect } from '@3id/connect'
import ThreeIdResolver from '@ceramicnetwork/3id-did-resolver'
import CeramicClient from '@ceramicnetwork/http-client'
import { DID } from 'dids'

import Web3Modal from 'web3modal'

const threeIdConnect = new ThreeIdConnect()

import { DagJWS } from 'dids'

// Pulled from https://github.com/ceramicnetwork/js-did/blob/bc5271f7e659d073e150389828c021156a80e6d0/src/utils.ts#L29
function fromDagJWS(jws: DagJWS): string {
    if (jws.signatures.length > 1) throw new Error('Cant convert to compact jws')
    return `${jws.signatures[0].protected}.${jws.payload}.${jws.signatures[0].signature}`
}

/**
 * An Authenticator using Web3Modal and 3IDConnect that automatically signs everything.
 * 
 * NOTE: DO NOT USE THIS IN PRODUCTION!
 * 
 * It effectively allows an application to unlock all user data stored across the Verida Network.
 * 
 * Use `@verida/acccount-web-vault` for secure unlocking of per application data.
 */
export default class ThreeIdConnectAccount implements AccountInterface {

    private web3ModalConfig?: object
    private ceramicUrl?: string
    private ceramic?: CeramicClient
    private accountDid?: DID

    constructor(web3ModalConfig?: object, ceramicUrl?: string) {
        this.web3ModalConfig = web3ModalConfig
        this.ceramicUrl = ceramicUrl
    }

    private async init() {
        if (this.accountDid) {
            return
        }

        const modalConfig = _.merge({
            network: "mainnet",
            cacheProvider: true,
        }, this.web3ModalConfig)

        const web3Modal = new Web3Modal(modalConfig)
        const ethProvider = await web3Modal.connect()
        const addresses = await ethProvider.enable()

        const authProvider = new EthereumAuthProvider(ethProvider, addresses[0])
        await threeIdConnect.connect(authProvider)

        const ceramic = new CeramicClient(this.ceramicUrl)
        const did = new DID({
            provider: threeIdConnect.getDidProvider(),
            // @ts-ignore See https://github.com/ceramicnetwork/js-ceramic/issues/1152
            resolver: ThreeIdResolver.getResolver(ceramic)
        })

        await did.authenticate()
        ceramic.setDID(did)

        this.accountDid = did
        this.ceramic = ceramic
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
        const jws = await this.accountDid!.createJWS(input)

        return fromDagJWS(jws)
    }

    public async did(): Promise<string> {
        await this.init()
        return this.accountDid!.id
    }

    /**
     * Link storage to this user
     * 
     * @param storageConfig 
     */
     public async linkStorage(storageConfig: Interfaces.SecureContextConfig): Promise<void> {
        await this.init()
         await StorageLink.setLink(this.ceramic!, this.accountDid!.id, storageConfig)
     }

     /**
      * Unlink storage for this user
      * 
      * @param contextName 
      */
    public async unlinkStorage(contextName: string): Promise<boolean> {
        await this.init()
        return await StorageLink.unlink(this.ceramic!, this.accountDid!.id, contextName)
    }

    public async getCeramic(): Promise<CeramicClient> {
        await this.init()
        return this.ceramic!
    }

}