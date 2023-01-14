'use strict'
const assert = require('assert')

import { Client } from '../../src/index'
import { AutoAccount } from '@verida/account-node'
import CONFIG from '../config'

const VERIDA_CONTEXT_NAME = "Verida: Vault"

/**
 * 
 */
describe('Basic vault tests', () => {

    describe('Test connecting', function() {
        this.timeout(60000)
        
        it('can open vault context', async function() {
            const client = new Client({
                environment: CONFIG.ENVIRONMENT,
        didClientConfig: {
            rpcUrl: CONFIG.DID_CLIENT_CONFIG.rpcUrl
        }
            })

            const account = new AutoAccount(CONFIG.DEFAULT_ENDPOINTS, {
                privateKey: CONFIG.VDA_PRIVATE_KEY,
                environment: CONFIG.ENVIRONMENT,
                didClientConfig: CONFIG.DID_CLIENT_CONFIG
            })
            await client.connect(account)
            const context = client.openContext(VERIDA_CONTEXT_NAME, true)
            assert.ok(context, "Have a valid context")
        })

        
    })
})