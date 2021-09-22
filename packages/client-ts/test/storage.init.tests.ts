'use strict'
const assert = require('assert')

import { Client } from '../src/index'
import { AutoAccount } from '@verida/account-node'
import { StorageLink } from '@verida/storage-link'

import CONFIG from './config'
StorageLink.setSchemaId(CONFIG.STORAGE_LINK_SCHEMA)

import { Wallet } from 'ethers'
const wallet = Wallet.createRandom()
const ETH_PRIVATE_KEY = wallet.privateKey

/**
 * WARNING: These tests create a new 3ID and storage context everytime they run!
 */
describe('Storage initialization tests', () => {
    let ceramic, did
    const network = new Client({
        ceramicUrl: CONFIG.CERAMIC_URL
    })

    describe('Initialize user storage contexts', function() {
        this.timeout(200000)

        it('can not force create a user storage context if not authenticated', async function() {
            const promise = new Promise((resolve, rejects) => {
                network.openContext(CONFIG.CONTEXT_NAME, true).then(rejects, resolve)
            })
            const result = await promise

            assert.deepEqual(result, new Error('Unable to force create a storage context when not connected'))
        })

        it('can authenticate a user', async function() {
            const account = new AutoAccount(CONFIG.DEFAULT_ENDPOINTS, {
                chain: 'ethr',
                privateKey: ETH_PRIVATE_KEY,
                ceramicUrl: CONFIG.CERAMIC_URL
            })
            ceramic = await account.getCeramic()

            did = await account.did()
            const seed = account.keyring(CONFIG.CONTEXT_NAME)

            assert.ok(did)
            assert.ok(seed)

            await network.connect(account)

            assert.ok(network.isConnected())
        })

        it(`cant open a user storage context that doesn't exist, even if authenticated`, async function() {
            const promise = new Promise((resolve, rejects) => {
                // open storage context without forcing it to be opened
                network.openContext(CONFIG.CONTEXT_NAME, false).then(rejects, resolve)
            })
            const result = await promise

            assert.deepEqual(result, new Error(`Unable to locate requested storage context (${CONFIG.CONTEXT_NAME}) for this DID (${did}) -- Storage context doesn't exist (try force create?)`))
        })

        it(`can force open a user storage context that doesn't exist when authenticated`, async function() {
            const accountContext = await network.openContext(CONFIG.CONTEXT_NAME, true)
            assert.ok(accountContext, 'Account storage opened')

            const accountStorageConfig = await accountContext.getContextConfig()
            const fetchedStorageConfig = await StorageLink.getLink(ceramic, ceramic.did.id, CONFIG.CONTEXT_NAME)

            assert.deepEqual(fetchedStorageConfig, accountStorageConfig, 'Storage context config matches')
        })
    })
})