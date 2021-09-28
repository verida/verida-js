'use strict'
const assert = require('assert')

import { Utils } from '../src/index'
import { Wallet } from 'ethers'

const wallet1 = Wallet.createRandom()
const wallet2 = Wallet.createRandom()

// null = use default (currently testnet)
const CERAMIC_URL = null

describe('Ethereum tests', () => {

    describe('Manage accounts', function() {
        this.timeout(100000)
        it('can create new 3ID', async function() {
            // Create two test Ethereum wallet

            // Instantiate utils
            const utils = new Utils(CERAMIC_URL)

            // Create a new 3ID for the wallet
            const ceramic1 = await utils.createAccount('ethr', wallet1.privateKey)
            assert.ok(ceramic1.did.id, '3ID created')

            const new3Id = ceramic1.did.id

            // Clear the ceramic instance and go again, ensuring we get the same 3ID
            utils.ceramic = null
            const ceramic2 = await utils.createAccount('ethr', wallet1.privateKey)
            assert.ok(ceramic2.did.id, '3ID retreived')
            assert.equal(ceramic1.did.id, ceramic2.did.id, 'Same 3ID returned')
        })

        it('can link a second ethereum account', async function() {
            // Instantiate utils
            const utils = new Utils(CERAMIC_URL)

            // Get the 3ID for the existing account
            const ceramic1 = await utils.createAccount('ethr', wallet1.privateKey)
            assert.ok(ceramic1.did.id, '3ID retreived')

            // Link the 3ID to the second Ethereum account
            utils.ceramic = null
            const ceramic2 = await utils.linkAccount('ethr', wallet2.privateKey, ceramic1.did.id)
            assert.equal(ceramic1.did.id, ceramic2.did.id, 'Second ethereum account linked with the same DID')

            // Clear the ceramic instance and go again, ensuring we get the same 3ID
            utils.ceramic = null
            const ceramic3 = await utils.createAccount('ethr', wallet2.privateKey)
            assert.ok(ceramic3.did.id, '3ID retreived')
            assert.equal(ceramic3.did.id, ceramic3.did.id, 'Same 3ID returned')
        })

    })
});
