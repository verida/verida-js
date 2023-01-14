const assert = require('assert')

import { Client } from '../../src/index'
import { AutoAccount } from '@verida/account-node'
import CONFIG from '../config'
import { assertIsValidDbResponse, sleep } from '../utils'

const DB_NAME_OWNER = 'OwnerBasicTestDb'

/**
 * 
 */
describe('Verida basic database tests', () => {
    let context1, did1, account1

    const network = new Client({
        environment: CONFIG.ENVIRONMENT,
        didClientConfig: {
            rpcUrl: CONFIG.DID_CLIENT_CONFIG.rpcUrl
        }
    })

    describe('Manage databases for the authenticated user', function() {
        this.timeout(200000)
        
        it('can open a database with owner/owner permissions', async function() {
            // Initialize account 1
            account1 = new AutoAccount(CONFIG.DEFAULT_ENDPOINTS, {
                privateKey: CONFIG.VDA_PRIVATE_KEY,
                environment: CONFIG.ENVIRONMENT,
                didClientConfig: CONFIG.DID_CLIENT_CONFIG
            })
            did1 = await account1.did()
            await network.connect(account1)
            context1 = await network.openContext(CONFIG.CONTEXT_NAME, true)

            const database = await context1.openDatabase(DB_NAME_OWNER, {
                saveDatabase: false
            })

            await database.save({'hello': 'world'})
            const data = await database.getMany()

            assertIsValidDbResponse(assert, data)
            assert.ok(data[0].hello == 'world', 'First result has expected value')
        })

        it('can delete an encrypted database', async () => {
            // Open the database
            let database = await context1.openDatabase(DB_NAME_OWNER, {
                saveDatabase: false
            })

            // Get the total number of rows
            const db = await database.getDb()
            const docs = await db.allDocs()
            const totalRows = docs.total_rows

            // Locally destroy the database
            await database.destroy({
                localOnly: true
            })

            // Re-open the database
            database = await context1.openDatabase(DB_NAME_OWNER, {
                saveDatabase: false
            })

            // Get the total number of rows
            const db2 = await database.getDb()
            const docs2 = await db2.allDocs()
            const totalRows2 = docs2.total_rows

            assert.equal(totalRows, totalRows2, `Total number of rows match indicating remote database wasn't deleted`)

            // Destroy the database remotely
            await database.destroy({
                localOnly: false
            })

            // Re-open the database
            database = await context1.openDatabase(DB_NAME_OWNER, {
                saveDatabase: false
            })

            // Get the total number of rows
            const db3 = await database.getDb()
            const docs3 = await db3.allDocs()
            const totalRows3 = docs3.total_rows

            assert.equal(totalRows3, 0, `No data in the database`)
        })

        // do again with public database

        this.afterAll(async () => {
            await context1.close()
        })
    })
})