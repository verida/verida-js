'use strict'
const assert = require('assert')
import { Wallet } from 'ethers'
import { Utils } from '../src/index'

// null = use default (currently testnet)
const CERAMIC_URL = 'https://ceramic-clay.3boxlabs.com'

function generateSeedPhrase() {
    const wallet = Wallet.createRandom()
    return wallet.mnemonic.phrase
}

describe('3ID Tests', () => {

    describe('Manage accounts', function() {
        this.timeout(100000)

        let ceramic, authProvider, generatedDid, seed

        it('can create new 3ID', async function() {
            seed = generateSeedPhrase()

            const utils1 = new Utils(CERAMIC_URL)
            const ceramic1 = ceramic = await utils1.createAccount('3id', seed)

            const did = generatedDid = ceramic1.did.id

            const utils2 = new Utils(CERAMIC_URL)
            const ceramic2 = await utils2.createAccount('3id', seed, {
                did
            })

            const did2 = ceramic2.did.id
            assert.equal(did, did2, 'Newly generated DID matches DID fetched from seed phrase')
        })

        it('can link an ethereum account to a 3id', async function() {
            const wallet1 = Wallet.createRandom()
            // Instantiate utils
            const utils = new Utils(CERAMIC_URL)

            // Instantiate the existing 3ID using the existing seed phrase and DID
            // This is necessary as it loads the 3id seed phrase into memory for use
            // when linking the ethereum account (further down)
            const ceramic1 = await utils.createAccount('3id', seed, {
                did: generatedDid
            })

            // Link the 3ID to the second Ethereum account
            const ceramic2 = await utils.linkAccount('ethr', wallet1.privateKey, generatedDid)
            assert.equal(generatedDid, ceramic2.did.id, 'Second ethereum account linked with the same DID')

            // Clear the ceramic instance and go again, ensuring we get the same 3ID
            utils.ceramic = null
            const ceramic3 = await utils.createAccount('ethr', wallet1.privateKey)
            
            assert.ok(ceramic3.did.id, '3ID retreived')
            assert.equal(ceramic3.did.id, ceramic2.did.id, 'Same 3ID returned')
            assert.equal(ceramic3.did.id, generatedDid, 'Same 3ID returned')
        })

    })
});
