const assert = require('assert')

import { Client } from '../../src/index'
import { AutoAccount } from '@verida/account-node'
import CONFIG from '../config'
import { assertIsValidDbResponse } from '../utils'

const DB_NAME_OWNER = 'OwnerBasicTestDb'
const DB_NAME_PUBLIC = 'PublicBasicTestDb'

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

    describe('Basic tests', function() {
        this.timeout(100000)
        
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
                saveDatabase: true
            })

            await database.save({'hello': 'world'})
            const data = await database.getMany()

            assertIsValidDbResponse(assert, data)
            assert.ok(data[0].hello == 'world', 'First result has expected value')
        })

        it('can delete an encrypted database', async () => {
            // Open the database
            let database = await context1.openDatabase(DB_NAME_OWNER, {
                saveDatabase: true
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
                saveDatabase: true
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

            // Check database has been removed from the database registry
            const dbRegistry = context1.getDbRegistry()
            let dbRemoved
            try {
                const record = await dbRegistry.get(DB_NAME_OWNER, did1, CONFIG.CONTEXT_NAME)
                dbRemoved = false
            } catch (err) {
                if (err.reason == 'deleted') {
                    dbRemoved = true
                } else {
                    assert.fail(err.message)
                }
            }

            assert.ok(dbRemoved, 'Database removed from DbRegistry')

            // Re-open the database
            database = await context1.openDatabase(DB_NAME_OWNER, {
                saveDatabase: true
            })

            // Get the total number of rows
            const db3 = await database.getDb()
            const docs3 = await db3.allDocs()
            const totalRows3 = docs3.total_rows

            assert.equal(totalRows3, 0, `No data in the database`)
        })

        it('can delete a public database', async () => {
            const permissions = {
                read: 'public',
                write: 'owner'
            }
            // Open the database
            let database = await context1.openDatabase(DB_NAME_PUBLIC, {
                saveDatabase: true,
                permissions
            })

            await database.save({'hello': 'world'})
            const data = await database.getMany()

            assertIsValidDbResponse(assert, data)
            assert.ok(data[0].hello == 'world', 'First result has expected value')

            // Get the total number of rows
            const db = await database.getDb()
            const docs = await db.allDocs()
            const totalRows = docs.total_rows

            // Locally destroy the database
            await database.destroy({
                localOnly: true
            })

            // Re-open the database
            database = await context1.openDatabase(DB_NAME_PUBLIC, {
                saveDatabase: true,
                permissions
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

            // Check database has been removed from the database registry
            const dbRegistry = context1.getDbRegistry()
            let dbRemoved
            try {
                const record = await dbRegistry.get(DB_NAME_PUBLIC, did1, CONFIG.CONTEXT_NAME)
                dbRemoved = false
            } catch (err) {
                if (err.reason == 'deleted') {
                    dbRemoved = true
                } else {
                    assert.fail(err.message)
                }
            }

            assert.ok(dbRemoved, 'Database removed from DbRegistry')

            // Re-open the database
            database = await context1.openDatabase(DB_NAME_PUBLIC, {
                saveDatabase: true,
                permissions
            })

            // Get the total number of rows
            const db3 = await database.getDb()
            const docs3 = await db3.allDocs()
            const totalRows3 = docs3.total_rows

            // Note: 1 document will exist as it's a design document for permissions
            assert.equal(totalRows3, 1, `No data in the database`)
        })

        this.afterAll(async () => {
            await context1.close({
                clearLocal: true
            })
        })
    })
})