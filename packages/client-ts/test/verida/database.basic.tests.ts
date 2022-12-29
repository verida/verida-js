'use strict'
const assert = require('assert')

import { Client } from '../../src/index'
import { AutoAccount } from '@verida/account-node'
import CONFIG from '../config'
import { assertIsValidDbResponse, assertIsValidSignature } from '../utils'

const DB_NAME_OWNER = 'OwnerBasicTestDb'

/**
 * 
 */
describe('Verida basic database tests', () => {
    let context, did1
    let DB_USER_ENCRYPTION_KEY

    const network = new Client({
        environment: CONFIG.ENVIRONMENT,
        didClientConfig: {
            rpcUrl: CONFIG.DID_CLIENT_CONFIG.rpcUrl
        }
    })

    describe('Manage databases for the authenticated user', function() {
        this.timeout(200000)
        
        it('can open a database with owner/owner permissions', async function() {
            // Initialize account 1
            const account1 = new AutoAccount(CONFIG.DEFAULT_ENDPOINTS, {
                privateKey: CONFIG.VDA_PRIVATE_KEY,
                environment: CONFIG.ENVIRONMENT,
                didClientConfig: CONFIG.DID_CLIENT_CONFIG
            })
            did1 = await account1.did()
            await network.connect(account1)
            context = await network.openContext(CONFIG.CONTEXT_NAME, true)

            const database = await context.openDatabase(DB_NAME_OWNER, {
                saveDatabase: false
            })

            await database.save({'hello': 'world'})
            const data = await database.getMany()

            assertIsValidDbResponse(assert, data)
            assert.ok(data[0].hello == 'world', 'First result has expected value')

            await context.close()
        })
    })
})