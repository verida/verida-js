'use strict'
const assert = require('assert')

import { Client } from '../../src/index'
import { AutoAccount } from '@verida/account-node'
import CONFIG from '../config'

const WALLET = {
    chain: "ethr",
    mnemonic: "sunset dry result clarify six vote hero fiscal globe latin shop grief",
    privateKey: "0x5dd84b6d500bcbc018cbc71b0407d694095755d91af42bd3442b2dfc96b1e0af",
    publicKey: "0x5dd84b6d500bcbc018cbc71b0407d694095755d91af42bd3442b2dfc96b1e0af",
    did: "did:ethr:0xB3729982A2585544FD72c99CF3773a9c6baBD55c",
    address: "0xB3729982A2585544FD72c99CF3773a9c6baBD55c",
}

const VERIDA_CONTEXT_NAME = "Verida: Vault"

/**
 * 
 */
describe('Basic vault tests', () => {

    describe('Test connecting', function() {
        this.timeout(60000)
        
        it('can open vault context', async function() {
            const wallet = WALLET
            const { privateKey } = wallet

            const client = new Client({
                ceramicUrl: CONFIG.CERAMIC_URL
            })

            const account = new AutoAccount(CONFIG.DEFAULT_ENDPOINTS, {
                chain: wallet.chain,
                privateKey: wallet.privateKey
            })
            await client.connect(account)
            const context = client.openContext(VERIDA_CONTEXT_NAME, true)
        })

        
    })
})