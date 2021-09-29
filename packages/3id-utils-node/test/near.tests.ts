'use strict'
const assert = require('assert')

import { Utils } from '../src/index'
const nearSeedPhrase = require('near-seed-phrase')

const WALLET1 = nearSeedPhrase.generateSeedPhrase()
const WALLET2 = nearSeedPhrase.generateSeedPhrase()

const SEED1 = WALLET1.seedPhrase
const SEED2 = WALLET2.seedPhrase

describe('NEAR 3ID creation', () => {

    describe('Identity creation and linking', function() {
        this.timeout(200000)

        it('can create new 3ID', async function() {
            // Instantiate utils
            const utils = new Utils()

            // Create a new 3ID for the wallet
            const ceramic1 = await utils.createAccount('near', SEED1)
            assert.ok(ceramic1.did.id, '3ID created')

            const new3Id = ceramic1.did.id

            // Clear the ceramic instance and go again, ensuring we get the same 3ID
            utils.ceramic = null
            const ceramic2 = await utils.createAccount('near', SEED2)
            assert.ok(ceramic2.did.id, '3ID retreived')
            assert.equal(ceramic1.did.id, ceramic2.did.id, 'Same 3ID returned')
        })

        it('can link a second account', async function() {
            // Instantiate utils
            const utils = new Utils()

            // Get the 3ID for the existing account
            const ceramic1 = await utils.createAccount('near', SEED1)
            assert.ok(ceramic1.did.id, '3ID retreived')

            // Link the 3ID to the second Ethereum account
            const ceramic2 = await utils.linkAccount('near', SEED2, ceramic1.did.id)
            assert.equal(ceramic1.did.id, ceramic2.did.id, 'Second ethereum account linked with the same DID')

            // Clear the ceramic instance and go again, ensuring we get the same 3ID
            utils.ceramic = null
            const ceramic3 = await utils.createAccount('near', SEED2)
            assert.ok(ceramic3.did.id, '3ID retreived')
            assert.equal(ceramic3.did.id, ceramic3.did.id, 'Same 3ID returned')
        })

    })
});
