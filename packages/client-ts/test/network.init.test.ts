'use strict'
const assert = require('assert')

import { Client } from '../src/index'
import { Utils } from '@verida/3id-utils-node'

// Test Ethereum Private key used to create / unlock a 3ID
const CERAMIC_URL = 'https://ceramic-clay.3boxlabs.com' // Note: Requires running ceramic locally

/**
 * 
 */
describe('Network initialization tests', () => {
    // Instantiate utils
    const utils = new Utils(CERAMIC_URL)
    let network

    describe('Initialize network connection', function() {

        it('can create a network instance', async function() {
            network = new Client({
                ceramicUrl: CERAMIC_URL
            })

            assert.ok(network)
        })
    })

})