'use strict'
const assert = require('assert')

import VeridaNetwork from '../src/index'
import { Utils } from '@verida/3id-utils-node'
import { AutoAccount } from '@verida/account'
import { StorageLink } from '@verida/storage-link'

// Test Ethereum Private key used to create / unlock a 3ID
//const ETH_PRIVATE_KEY = '0xc0da48347b4bcb2cfb08d6b8c26b52b47fd36ca6114974a0104d15fab076f553'
const CERAMIC_URL = 'http://localhost:7007' // Note: Requires running ceramic locally
const CONTEXT_NAME = 'My Test Application'

import { Wallet } from 'ethers'
const wallet = Wallet.createRandom()
const ETH_PRIVATE_KEY = wallet.privateKey

/**
 * WARNING: These tests create a new 3ID and storage context everytime they run!
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

        it('can not open a user storage context if not authenticated', async function() {
            const promise = new Promise((resolve, rejects) => {
                network.openStorageContext(CONTEXT_NAME).then(rejects, resolve)
            })
            const result = await promise

            assert.deepEqual(result, new Error('Unable to locate requested storage context for this user -- Not authenticated'))
        })

        it('can authenticate a user', async function() {
            ceramic = await utils.createAccount('ethr', ETH_PRIVATE_KEY)
            const account = new AutoAccount(ceramic)

            const did = account.did()
            const seed = account.keyring(CONTEXT_NAME)

            assert.ok(did)
            assert.ok(seed)

            await network.connect(account)

            assert.ok(network.isConnected())
        })

        it(`cant open a user storage context that doesn't exist, even if authenticated`, async function() {
            const promise = new Promise((resolve, rejects) => {
                network.openStorageContext(CONTEXT_NAME).then(rejects, resolve)
            })
            const result = await promise

            assert.deepEqual(result, new Error(`Unable to locate requested storage context for this user -- Storage context doesn't exist (try force create?)`))
        })

        it(`can force open a user storage context that doesn't exist when authenticated`, async function() {
            const accountStorage = await network.openStorageContext(CONTEXT_NAME, true)

            assert.ok(accountStorage, 'Account storage opened')

            const fetchedStorageConfig = await StorageLink.getLink(ceramic, ceramic.did.id, CONTEXT_NAME)
            assert.deepEqual(fetchedStorageConfig, accountStorage.getStorageConfig(), 'Storage context config matches')
        })
    })
})