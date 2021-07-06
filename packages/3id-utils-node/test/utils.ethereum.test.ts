'use strict'
const assert = require('assert')

import { Utils } from '../src/index'
import { Wallet } from 'ethers'

const wallet1 = Wallet.createRandom()
const wallet2 = Wallet.createRandom()

describe('3ID Node Utils', () => {

    describe('Manage accounts', function() {
        this.timeout(100000)
        it('can create new 3ID', async function() {
            // Create two test Ethereum wallet

            // Instantiate utils
            const utils = new Utils()

            // Create a new 3ID for the wallet
            const did1 = await utils.createAccount('ethr', wallet1.privateKey)
            assert.ok(did1.id, '3ID created')

            const new3Id = did1.id

            // Clear the ceramic instance and go again, ensuring we get the same 3ID
            utils.ceramic = null
            const did1Again = await utils.createAccount('ethr', wallet1.privateKey)
            assert.ok(did1Again.id, '3ID retreived')
            assert.equal(did1.id, did1Again.id, 'Same 3ID returned')
        })

        it('can link a second ethereum account', async function() {
            // Instantiate utils
            const utils = new Utils()

            // Get the 3ID for the existing account
            const did1 = await utils.createAccount('ethr', wallet1.privateKey)
            assert.ok(did1.id, '3ID retreived')

            // Link the 3ID to the second Ethereum account
            const did2 = await utils.linkAccount('ethr', wallet2.privateKey, did1.id)
            assert.equal(did1.id, did2.id, 'Second ethereum account linked with the same DID')

            // Clear the ceramic instance and go again, ensuring we get the same 3ID
            utils.ceramic = null
            const did2Again = await utils.createAccount('ethr', wallet2.privateKey)
            assert.ok(did2Again.id, '3ID retreived')
            assert.equal(did2.id, did1.id, 'Same 3ID returned')
        })

    })
});
