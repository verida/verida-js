'use strict'
const assert = require('assert')

import CeramicClient from '@ceramicnetwork/http-client'
//import { Utils } from '../src/index'
import { Wallet } from 'ethers'
import ThreeIdProvider from '3id-did-provider'

// null = use default (currently testnet)
const CERAMIC_URL = 'https://ceramic-clay.3boxlabs.com'

function generateSeedPhrase() {
    const wallet = Wallet.createRandom()
    return wallet.mnemonic.phrase
}

function getPrivateKey(seedPhrase) {
    const wallet = Wallet.fromMnemonic(seedPhrase)
    return Buffer.from(wallet.privateKey.substr(2), 'hex')
}

describe('3ID Tests', () => {

    describe('Manage accounts', function() {
        this.timeout(100000)

        it('can create new 3ID', async function() {
            // Create a new 3ID
            const seed = generateSeedPhrase()
            const privateKey = getPrivateKey(seed)
            const ceramic = new CeramicClient(CERAMIC_URL)

            const getPermission = async (request) => {
                return request.payload.paths
            }

            const threeId = await ThreeIdProvider.create({
                getPermission,
                seed: privateKey,
                ceramic
            })

            const did = ceramic.did.id
            console.log(`did generated: ${did}, ${seed}, ${privateKey}`)

            const privateKey2 = getPrivateKey(seed)
            const ceramic2 = new CeramicClient(CERAMIC_URL)

            const threeId2 = await ThreeIdProvider.create({
                getPermission,
                seed: privateKey2,
                ceramic: ceramic2
            })

            const did2 = ceramic2.did.id
            console.log(`did2 generated: ${did2}, ${seed}, ${privateKey2}`)

            assert.equal(did, did2, 'Newly generated DID matches DID fetched from seed phrase')
        })

        /*it('can link a second ethereum account', async function() {
            // Instantiate utils
            const utils = new Utils(CERAMIC_URL)

            // Get the 3ID for the existing account
            const ceramic1 = await utils.createAccount('ethr', wallet1.privateKey)
            assert.ok(ceramic1.did.id, '3ID retreived')

            // Link the 3ID to the second Ethereum account
            const ceramic2 = await utils.linkAccount('ethr', wallet2.privateKey, ceramic1.did.id)
            assert.equal(ceramic1.did.id, ceramic2.did.id, 'Second ethereum account linked with the same DID')

            // Clear the ceramic instance and go again, ensuring we get the same 3ID
            utils.ceramic = null
            const ceramic3 = await utils.createAccount('ethr', wallet2.privateKey)
            assert.ok(ceramic3.did.id, '3ID retreived')
            assert.equal(ceramic3.did.id, ceramic3.did.id, 'Same 3ID returned')
        })*/

    })
});
