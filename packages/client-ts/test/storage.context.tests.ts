'use strict'
const assert = require('assert')

import { Client } from '../src/index'
import { AutoAccount } from '@verida/account-node'
import { StorageLink } from '@verida/storage-link'
import { DIDDocument } from '@verida/did-document'
import CONFIG from './config'

const TEST_DB_NAME = 'TestDb_1a'
const TEST_DB_NAME_2 = 'TestDb_2a'
const TEST_DB_NAME_3 = 'TestDb_3a'

const LOAD_DEFAULT_STORAGE_NODES = true

/**
 * 
 */
describe('Storage context tests', () => {
    let didClient, context

    const client = new Client({
        network: CONFIG.NETWORK,
        didClientConfig: {
            network: CONFIG.NETWORK,
            rpcUrl: CONFIG.DID_CLIENT_CONFIG.rpcUrl
        }
    })

    describe('Initialize user storage contexts', function() {
        this.timeout(200 * 1000)

        it(`can open a user storage context when authenticated`, async function() {
            const account = new AutoAccount({
                privateKey: CONFIG.VDA_PRIVATE_KEY,
                network: CONFIG.NETWORK,
                didClientConfig: CONFIG.DID_CLIENT_CONFIG
            })
            await client.connect(account)

            if (LOAD_DEFAULT_STORAGE_NODES) {
                await account.loadDefaultStorageNodes('AU')
            }

            didClient = await account.getDidClient()
            const did = await account.did()
            await StorageLink.unlink(CONFIG.NETWORK, didClient, CONFIG.CONTEXT_NAME)

            context = await client.openContext(CONFIG.CONTEXT_NAME, true)
            assert.ok(context, 'Account context opened')

            const fetchedStorageConfig = await StorageLink.getLink(CONFIG.NETWORK, didClient, did, CONFIG.CONTEXT_NAME)
            const contextConfig = await context.getContextConfig()

            const existing = contextConfig.services
            const fetched = fetchedStorageConfig!.services

            contextConfig.id = DIDDocument.generateContextHash(did, CONFIG.CONTEXT_NAME)
            assert.deepEqual(existing, fetched, 'Storage context config matches')
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

        it('can open same database at once and both return the same cache entry', async () => {
            const database1 = context.openDatabase(TEST_DB_NAME_2)
            const database2 = context.openDatabase(TEST_DB_NAME_2)

            await Promise.all([database1, database2]).then(async ([db1, db2]) => {
                const info1 = await db1.info()
                const info2 = await db2.info()
                assert.deepEqual(info1, info2, 'Returned databases are the same')
            })
        })

        it('can respect ignore cache when opening a database', async () => {
            const database1 = context.openDatabase(TEST_DB_NAME_3)
            const database2 = context.openDatabase(TEST_DB_NAME_3, {
                ignoreCache: true
            })

            await Promise.all([database1, database2]).then(([db1, db2]) => {
                assert.ok(db1 !== db2, 'Returned databases are not the same')
            })
        })
    })

    after(async () => {
        await context.close({
            clearLocal: true
        })
    })
})