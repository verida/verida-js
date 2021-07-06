import { DID } from 'dids'
import CeramicClient from '@ceramicnetwork/http-client'

const ethereumUtils = require('./chains/ethereum').default

type Dictionary = { [index: string]: any }

const chains:Dictionary = {
    'ethr': ethereumUtils
}

const CERAMIC_URL = 'https://ceramic-clay.3boxlabs.com'

/**
 * A set of utility methods to help manage 3ID's within a Node environment
 */
export default class utils {

    ceramicUrl: string
    ceramic?: CeramicClient

    constructor(ceramicUrl?: string) {
        this.ceramicUrl = ceramicUrl ? ceramicUrl : CERAMIC_URL
    }

    async createAccount(chain: string, privateKey: string): Promise<DID | undefined>  {
        const ceramic = this.getCeramic()
        return chains[chain].createAccount(privateKey, ceramic)
    }

    async linkAccount(chain: string, privateKey: string, did3id: string) {
        const ceramic = this.getCeramic()
        return chains[chain].linkAccount(privateKey, did3id, ceramic)
    }

    getCeramic(): CeramicClient {
        return this.ceramic ? this.ceramic : new CeramicClient(this.ceramicUrl)
    }

}