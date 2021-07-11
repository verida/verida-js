'use strict'
const assert = require('assert')

import VeridaNetwork from '../src/index'
import { Utils } from '@verida/3id-utils-node'
import { AutoAccount } from '@verida/account'
import { StorageLink } from '@verida/storage-link'

// Test Ethereum Private key used to create / unlock a 3ID
const ETH_PRIVATE_KEY = '0xc0da48347b4bcb2cfb08d6b8c26b52b47fd36ca6114974a0104d15fab076f553'
const CERAMIC_URL = 'http://localhost:7007' // Note: Requires running ceramic locally
const CONTEXT_NAME = 'My Test Application'

/**
 * 
 */
describe('Storage initialization tests', () => {
    // Instantiate utils
    const utils = new Utils(CERAMIC_URL)
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
        ceramicUrl: CERAMIC_URL
    })

    describe('Initialize user storage contexts', function() {
        this.timeout(100000)

        it(`can open a user storage context when authenticated`, async function() {
            ceramic = await utils.createAccount('ethr', ETH_PRIVATE_KEY)
            const account = new AutoAccount(ceramic)
            await network.connect(account)

            await StorageLink.unlink(ceramic, ceramic.did.id, CONTEXT_NAME)

            context = await network.openContext(CONTEXT_NAME, true)
            assert.ok(context, 'Account context opened')

            const fetchedStorageConfig = await StorageLink.getLink(ceramic, ceramic.did.id, CONTEXT_NAME)
            assert.deepEqual(fetchedStorageConfig, context.getStorageConfig(), 'Storage context config matches')
        })

        it('can fetch a user storage instance', async function() {
            storage = await context.getStorage()
            assert.ok(storage)
        })

        it('can open a database with owner/owner permissions', async function() {
            const database = await storage.openDatabase('Test db')
            assert.ok(database)

            await database.save({'hello': 'world'})
            const data = await database.getMany()
            console.log(data)
        })
        
    })
})