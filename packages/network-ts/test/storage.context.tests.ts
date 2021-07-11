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
    let ceramic
    const network = new VeridaNetwork({
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

    describe('Initialize user storage contexts', function() {
        this.timeout(200000)

        it(`can open a user storage context when authenticated`, async function() {
            ceramic = await utils.createAccount('ethr', ETH_PRIVATE_KEY)
            const account = new AutoAccount(ceramic)
            await network.connect(account)

            const accountStorage = await network.openStorageContext(CONTEXT_NAME, true)
            assert.ok(accountStorage, 'Account storage opened')

            const fetchedStorageConfig = await StorageLink.getLink(ceramic, ceramic.did.id, CONTEXT_NAME)
            assert.deepEqual(fetchedStorageConfig, accountStorage.getStorageConfig(), 'Storage context config matches')
        })
        
    })
})