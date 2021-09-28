'use strict'
const assert = require('assert')

import { Client } from '../../src/index'
import { AutoAccount } from '@verida/account-node'
import { StorageLink } from '@verida/storage-link'
import CONFIG from '../config'
StorageLink.setSchemaId(CONFIG.STORAGE_LINK_SCHEMA)

const DB_NAME_OWNER = 'OwnerTestDb_1'

/**
 * 
 */
describe('Verida database tests', () => {
    let context, did1

    const network = new Client({
        ceramicUrl: CONFIG.CERAMIC_URL
    })

    describe('Manage databases for the authenticated user', function() {
        this.timeout(200000)
        
        it('can open a database with owner/owner permissions', async function() {
            // Initialize account 1
            const account1 = new AutoAccount(CONFIG.DEFAULT_ENDPOINTS, {
                chain: 'ethr',
                privateKey: CONFIG.ETH_PRIVATE_KEY,
                ceramicUrl: CONFIG.CERAMIC_URL
            })
            did1 = await account1.did()
            await network.connect(account1)
            context = await network.openContext(CONFIG.CONTEXT_NAME, true)
            const database = await context.openDatabase(DB_NAME_OWNER)

            const promise: Promise<void> = new Promise((resolve, rejects) => {
                database.changes(function(info) {
                    assert.ok(info, 'Info is supplied')
                    resolve()
                })
                
                database.save({'hello': 'world'})
            })
        })

        
    })

})