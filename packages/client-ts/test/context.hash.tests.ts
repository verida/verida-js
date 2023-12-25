

'use strict'
const assert = require('assert')

import { Client } from '../src/index'
import { AutoAccount } from '@verida/account-node'
import { StorageLink } from '@verida/storage-link'
import { DIDDocument } from '@verida/did-document'
import CONFIG from './config'
import { EnvironmentType, IDatabase } from '@verida/types'

const TEST_DB_NAME = 'TestDb_1'
const CONTEXT_NAME = 'Verida Test: Context Hash'

const PRIVATE_KEY = '0x002efd2e44f0d2cbbb71506a02a2043ba45f222f04b501f139f29a0d3b21f003'
const ENVIRONMENT = EnvironmentType.DEVNET

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * Things to test
 * 
 * 1. Open context by name or hash, returns the same databases
 * 2. If context hash is supplied, unable to create a new context (should only create with the correct name)
 */

const saveAndVerify = async (database: any) => {
    console.log(`Attempting to save a record`)
    const result = await database.save({'hello': 'world'})
    console.log(`Record saved`, result)
    console.log(`Fetching records`)
    const data = await database.getMany({
        _id: result.id
    })
    assert.ok(data, 'Data returned')
    console.log(`Records fetched`)

    assert.ok(data.length && data.length > 0, 'Array returned with at least one row')
    assert.ok(data[0].hello == 'world', 'First result has expected value')
}

/**
 * Test a single (or collection) of storage nodes
 */
describe('Storage context hash tests', () => {
    let didClient, contextByName, contextByHash

    const client = new Client({
        environment: CONFIG.ENVIRONMENT,
        didClientConfig: {
            network: ENVIRONMENT,
        }
    })

    describe('Perform tests', function() {
        this.timeout(200 * 1000)

        it(`can open same context with either name or hash`, async function() {
            const account = new AutoAccount({
                privateKey: PRIVATE_KEY,
                environment: ENVIRONMENT,
                didClientConfig: {
                    ...CONFIG.DID_CLIENT_CONFIG,
                }
            })
            await client.connect(account)
            await account.loadDefaultStorageNodes('AU')
            didClient = await account.getDidClient()
            const did = await account.did()

            console.log(`Opening context (by name) for DID: ${did}`)
            contextByName = await client.openContext(CONTEXT_NAME, true)
            assert.ok(context, 'Account context (by name) opened')
            console.log(`Context (by name) opened`)

            // Open database
            console.log(`Attempting to open a database`)
            const database = await contextByName.openDatabase(TEST_DB_NAME)
            
            // Get database info
            const dbInfo = await database.info()
            console.log(`Database info`)
            console.log(dbInfo)

            // Save and verify a record
            console.log(`Saving a record to context (by name)`)
            const result = await database.save({'context': 'by name'})
            const contextNameData = await database.getMany({
                _id: result.id
            })
            assert.ok(contextNameData, 'Data returned')
            assert.ok(contextNameData.length && contextNameData.length > 0, 'Array returned with at least one row')
            assert.ok(contextNameData[0].context == 'by name', 'First result has expected value')
            console.log('Save complete')

            // Close context by name
            await contextByName.close()
            console.log(`Closed context by name`)

            // Open hash context
            const contextHash = DIDDocument.generateContextHash(did, CONTEXT_NAME);

            console.log(`Opening context (by name) for DID: ${did}`)
            contextByName = await client.openContext(contextHash, false)
            assert.ok(context, 'Account context (by hash) opened')
            console.log(`Context (by hash) opened`)

            // Open database
            console.log(`Attempting to open a database`)
            const database2 = await contextByName.openDatabase(TEST_DB_NAME)

            // Confirm the context name record exists
            const contextTestData = await database.getMany({
                _id: result.id
            })
            assert.ok(contextTestData, 'Data returned')
            assert.ok(contextTestData.length && contextTestData.length > 0, 'Array returned with at least one row')
            assert.ok(contextTestData[0].context == 'by name', 'First result has expected value')

            
            // Get database info
            const dbInfo2 = await database2.info()
            console.log(`Database info`)
            console.log(dbInfo2)

            // Save and verify a record
            console.log(`Saving a record to context (by name)`)
            const result2 = await database2.save({'context': 'by hash'})
            const contextHashData = await database2.getMany({
                _id: result2.id
            })
            assert.ok(contextHashData, 'Data returned')
            assert.ok(contextHashData.length && contextHashData.length > 0, 'Array returned with at least one row')
            assert.ok(contextHashData[0].context == 'by hash', 'First result has expected value')
            console.log('Save complete')

            // Delete database
            await contextByHash.deleteDatabase(TEST_DB_NAME)
            console.log(`${TEST_DB_NAME} database deleted`)

            await contextByHash.close({
                clearLocal: true
            })
        })
    })  

    after(async () => {
        
    })
})