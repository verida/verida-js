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
                environment: CONFIG.ENVIRONMENT
            })
            assert.ok(network, 'Have a network instance')
        })
    })

})