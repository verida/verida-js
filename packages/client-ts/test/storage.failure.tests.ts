'use strict'
const assert = require('assert')

import { Client } from '../src/index'
import { AutoAccount } from '@verida/account-node'
import CONFIG from './config'
import { EnvironmentType, IDatabase } from '@verida/types'

const TEST_DB_NAME = 'TestDb_1'
const CONTEXT_NAME = 'Verida Test: Node failure'
//const CONTEXT_NAME = '0xaf76137db7f06af84bca9ecf9666846c61c41b2fcad80e435f1aa3897a8426a0'

const PRIVATE_KEY = '0x002efd2e44f0d2cbbb71506a02a2043ba45f222f04b501f139f29a0d3b21f002'
const ENVIRONMENT = EnvironmentType.DEVNET

const SLEEP_SECONDS = 30
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * Things to test:
 * 
 * 1. (Y) Successfully open a database connection when a node is unavailable.
 * 2. (Fixed) Successfully save database data to a different server if the currently connected server is unavailable
 * 3. (Fixed) Successfully delete a database with a node down, the database is removed from all nodes that are live, even when one node is down
 * 3. (No, unsure how to achieve this) Successfully delete a database with a node down, the database is removed when the node comes back online
 * 4. (Y) When connecting, a random node is selected, not the first node (Yes, stays the same for a 1 hr period)
 * 5. (Fixed) Replication on the server when a node is down, is working correctly
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
describe('Storage node failure tests', () => {
    let didClient, context

    const client = new Client({
        environment: CONFIG.ENVIRONMENT,
        didClientConfig: {
            network: ENVIRONMENT,
        }
    })

    describe.skip('Failures', function() {
        this.timeout(200 * 1000)

        it(`can use a database with a node down`, async function() {
            // Note: Stop one of the storage nodes for the DID before running this test
            console.log(`Ensure you have stopped one of the storage nodes associated with this DID / Context before running this test.`)

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

            console.log(`Opening context for DID: ${did}`)
            context = await client.openContext(CONTEXT_NAME, true)
            assert.ok(context, 'Account context opened')
            console.log(`Context opened`)

            // Open database
            console.log(`Attempting to open a database`)
            const database = await context.openDatabase(TEST_DB_NAME)
            
            // Get database info
            const dbInfo = await database.info()
            console.log(`Database info`)
            console.log(dbInfo)

            // Save and verify a record
            await saveAndVerify(database)
            console.log('Complete')

            // Delete database
            await context.deleteDatabase(TEST_DB_NAME)
            console.log(`${TEST_DB_NAME} database deleted`)
        })

        it(`can failover if a connected node goes down`, async function() {
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

            console.log(`Opening context for DID: ${did}`)
            context = await client.openContext(CONTEXT_NAME, true)
            assert.ok(context, 'Account context opened')
            console.log(`Context opened`)

            // Open database
            console.log(`Attempting to open a database`)
            const database = await context.openDatabase(TEST_DB_NAME)

            const sourceDbEngine = await context.getDatabaseEngine(did)
            const sourceDbInfo = await sourceDbEngine.info()
            console.log(sourceDbInfo)

            const data = await database.getMany()
            console.log(data)
            
            // Get database info
            const dbInfo = await database.info()
            console.log(`Database info`)
            console.log(dbInfo)

            // Save and verify a record
            await saveAndVerify(database)

            // Sleep for 60 seconds so server can be manually shut down
            console.log(`Sleeping for ${SLEEP_SECONDS} seconds, shut down the node (${dbInfo.endpoint})`)
            await sleep(SLEEP_SECONDS * 1000)

            // Save and verify another record
            await saveAndVerify(database)

            // Get database info
            const dbInfo2 = await database.info()
            console.log(`Database info`)
            console.log(dbInfo2)

            const finalData = await database.getMany()
            console.log('all data:')
            console.log(finalData)

            console.log('Closing the database')
            await database.close({
                clearLocal: true
            })

            // Delete database
            await context.deleteDatabase(TEST_DB_NAME)
            console.log(`${TEST_DB_NAME} database deleted`)
        })
    })

    after(async () => {
        await context.close({
            clearLocal: true
        })
    })
})