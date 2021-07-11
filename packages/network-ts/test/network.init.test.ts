'use strict'
const assert = require('assert')

import VeridaNetwork from '../src/index'
import { Utils } from '@verida/3id-utils-node'

// Test Ethereum Private key used to create / unlock a 3ID
const CERAMIC_URL = 'http://localhost:7007' // Note: Requires running ceramic locally

/**
 * 
 */
describe('Network initialization tests', () => {
    // Instantiate utils
    const utils = new Utils(CERAMIC_URL)
    let ceramic
    let network

    describe('Initialize network connection', function() {

        it('can create a network instance', async function() {
            network = new VeridaNetwork({
                defaultStorageServer: {
                    type: 'VeridaStorage',
                    endpointUri: 'https://localhost:7001/'
                },
                defaultMessageServer: {
                    type: 'VeridaStorage',
                    endpointUri: 'https://localhost:7001/'
                },
                ceramicUrl: CERAMIC_URL
            })

            assert.ok(network)
        })
    })

})