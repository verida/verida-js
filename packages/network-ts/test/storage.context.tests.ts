'use strict'
const assert = require('assert')

import VeridaNetwork from '../src/index'
import { Utils } from '@verida/3id-utils-node'
import { AutoAccount } from '@verida/account'
import { StorageLink } from '@verida/storage-link'
import CONFIG from './config'
StorageLink.setSchemaId(CONFIG.STORAGE_LINK_SCHEMA)

const TEST_DB_NAME = 'TestDb'

/**
 * 
 */
describe('Storage initialization tests', () => {
    // Instantiate utils
    const utils = new Utils(CONFIG.CERAMIC_URL)
    let ceramic, context, storage

    const network = new VeridaNetwork({
        defaultStorageServer: {
            type: 'VeridaStorage',
            endpointUri: 'http://localhost:5000/'
        },
        defaultMessageServer: {
            type: 'VeridaStorage',
            endpointUri: 'http://localhost:5000/'
        },
        ceramicUrl: CONFIG.CERAMIC_URL
    })

    describe('Initialize user storage contexts', function() {
        this.timeout(100000)

        it(`can open a user storage context when authenticated`, async function() {
            ceramic = await utils.createAccount('ethr', CONFIG.ETH_PRIVATE_KEY)
            const account = new AutoAccount(ceramic)
            await network.connect(account)

            await StorageLink.unlink(ceramic, ceramic.did.id, CONFIG.CONTEXT_NAME)

            context = await network.openContext(CONFIG.CONTEXT_NAME, true)
            assert.ok(context, 'Account context opened')

            const fetchedStorageConfig = await StorageLink.getLink(ceramic, ceramic.did.id, CONFIG.CONTEXT_NAME)
            assert.deepEqual(fetchedStorageConfig, context.getStorageConfig(), 'Storage context config matches')
        })

        it('can fetch a user storage instance', async function() {
            storage = await context.getStorage()
            assert.ok(storage)
        })

        it('can open a database with owner/owner permissions', async function() {
            const database = await storage.openDatabase(TEST_DB_NAME)

            await database.save({'hello': 'world'})
            const data = await database.getMany()

            assert.ok(data, 'Data returned')
            assert.ok(data.length && data.length > 1, 'Array returned with at least one row')
            assert.ok(data[0].hello == 'world', 'First result has expected value')
        })
        
    })
})