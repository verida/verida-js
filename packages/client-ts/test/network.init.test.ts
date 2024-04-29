const assert = require('assert')

import { Client } from '../src/index'
import CONFIG from "./config"

/**
 * 
 */
describe('Network initialization tests', () => {
    describe('Initialize network connection', function() {

        it('can create a network instance', async function() {
            const network = new Client({
                network: CONFIG.NETWORK
            })
            assert.ok(network, 'Have a network instance')
        })
    })

})