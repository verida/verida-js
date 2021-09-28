'use strict'
const assert = require('assert')

import { Client } from '../src/index'
import { AutoAccount } from '@verida/account-node'
import { StorageLink } from '@verida/storage-link'
import CONFIG from './config'
StorageLink.setSchemaId(CONFIG.STORAGE_LINK_SCHEMA)

const TEST_DB_NAME = 'TestDb_1'

/**
 * 
 */
describe('Storage context tests', () => {
    let ceramic, context

    const client = new Client({
        ceramicUrl: CONFIG.CERAMIC_URL
    })

    describe('Initialize user storage contexts', function() {
        this.timeout(100000)

        it(`can open a user storage context when authenticated`, async function() {
            const account = new AutoAccount(CONFIG.DEFAULT_ENDPOINTS, {
                chain: 'ethr',
                privateKey: CONFIG.ETH_PRIVATE_KEY,
                ceramicUrl: CONFIG.CERAMIC_URL
            })
            await client.connect(account)
            const ceramic = await account.getCeramic()

            await StorageLink.unlink(ceramic, ceramic.did.id, CONFIG.CONTEXT_NAME)

            context = await client.openContext(CONFIG.CONTEXT_NAME, true)
            assert.ok(context, 'Account context opened')

            const fetchedStorageConfig = await StorageLink.getLink(ceramic, ceramic.did.id, CONFIG.CONTEXT_NAME)
            const contextConfig = await context.getContextConfig()
            assert.deepEqual(fetchedStorageConfig, contextConfig, 'Storage context config matches')
        })

        it('can open a database with owner/owner permissions', async function() {
            const database = await context.openDatabase(TEST_DB_NAME)

            const result = await database.save({'hello': 'world'})
            const data = await database.getMany({
                _id: result.id
            })

            assert.ok(data, 'Data returned')
            assert.ok(data.length && data.length > 0, 'Array returned with at least one row')
            assert.ok(data[0].hello == 'world', 'First result has expected value')
        })
        
    })
})