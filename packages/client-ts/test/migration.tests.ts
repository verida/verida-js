'use strict'
const assert = require('assert')

import { Client } from '../src/index'
import { AutoAccount } from '@verida/account-node'
import CONFIG from './config'
import { EnvironmentType } from '@verida/types'
import { migrateContext } from '../src/utils/migration'

const TEST_DBS = ['db1-test', 'db2-test', 'db3-test']

const SOURCE_CONTEXT_NAME = 'Verida Test: Migration - Source Context'
const DESTINATION_CONTEXT_NAME = 'Verida Test: Migration - Destination Context'

/**
 * 
 */
describe('Storage context tests', () => {
    let sourceContext, destinationContext

    const client1 = new Client({
        environment: CONFIG.ENVIRONMENT,
        didClientConfig: {
            network: EnvironmentType.TESTNET,
            rpcUrl: CONFIG.DID_CLIENT_CONFIG.rpcUrl
        }
    })

    const client2 = new Client({
        environment: CONFIG.ENVIRONMENT,
        didClientConfig: {
            network: EnvironmentType.TESTNET,
            rpcUrl: CONFIG.DID_CLIENT_CONFIG.rpcUrl
        }
    })

    describe('Initialize user storage contexts', function() {
        this.timeout(200 * 1000)

        it(`can open the source and destination application contexts`, async function() {
            const account1 = new AutoAccount({
                privateKey: CONFIG.VDA_PRIVATE_KEY,
                environment: CONFIG.ENVIRONMENT,
                didClientConfig: CONFIG.DID_CLIENT_CONFIG
            })
            const account2 = new AutoAccount({
                privateKey: CONFIG.VDA_PRIVATE_KEY,
                environment: CONFIG.ENVIRONMENT,
                didClientConfig: CONFIG.DID_CLIENT_CONFIG
            })

            await client1.connect(account1)
            await client2.connect(account2)

            sourceContext = await client1.openContext(SOURCE_CONTEXT_NAME, true)
            assert.ok(context, 'Source context opened')

            destinationContext = await client2.openContext(DESTINATION_CONTEXT_NAME, true)
            assert.ok(context, 'Destination context opened')
        })

        it('can create test database data', async function() {
            for (let i in TEST_DBS) {
                const dbName = TEST_DBS[i]
                const db = await sourceContext.openDatabase(dbName)
                await db.save({record: 1})
                await db.save({record: 2})
                await db.save({record: 3})
                await db.close()
            }

            assert.ok(true, 'Test database data created')
        })

        it('can migrate data from source context to the destination context', async function() {
            const events = migrateContext(sourceContext, destinationContext)

            events.on('start', (databases: object) => {
                console.log('Migration starting with databases:')
                console.log(databases)
            })

            events.on('migrated', (dbInfo, dbIndex, totalDbs) => {
                const percentComplete = (dbIndex) / totalDbs * 100
                console.log(`Migrated database ${dbInfo.databaseName} (${dbIndex}/${totalDbs}) (${percentComplete}%)`)
            })

            const promise = new Promise((resolve, rejects) => {
                events.on('complete', () => {
                    console.log('Migration complete!')
                    resolve(true)
                })

                events.on('error', (err: any) => {
                    console.log('Migration error!')
                    console.log(err)
                    rejects(err)
                })
            })

            try {
                const result = await promise
                assert.ok(true, 'Data migrated')
            } catch (err) {
                assert.fail(err.message)
            }
        })

        it('can verify database data matches exactly', async function() {
            // Close and re-open contexts to reset everything
            await sourceContext.close({
                clearLocal: true
            })
            await destinationContext.close({
                clearLocal: true
            })

            sourceContext = await client1.openContext(SOURCE_CONTEXT_NAME)
            destinationContext = await client2.openContext(DESTINATION_CONTEXT_NAME)

            // Verify data for all databases
            for (let i in TEST_DBS) {
                const dbName = TEST_DBS[i]

                try {
                    const sourceDb = await sourceContext.openDatabase(dbName, {
                        verifyEncryptionKey: false
                    })
                    const destinationDb = await destinationContext.openDatabase(dbName, {
                        verifyEncryptionKey: false
                    })

                    const sourceRows = await sourceDb.getMany()
                    const destinationRows = await destinationDb.getMany()

                    // Verify the same number of rows returned
                    assert.equal(destinationRows.length, sourceRows.length, `${dbName}: source and destination databases have same length`)

                    // Verify the same row IDs are returned
                    const sourceIds = sourceRows.map((item) => item.id)
                    const destinationIds = destinationRows.map((item) => item.id)
                    assert.deepEqual(sourceIds, destinationIds, `${dbName}: source and destination databases have same records`)
                } catch (err) {
                    console.log(dbName)
                    console.log(err)
                    assert.fail(err.message)
                }
            }
        })

        /**
         * When re-starting an existing migration, any changes to the source data that has already
         * been sent to the destination will not be updated. This also includes deletions on the 
         * source data that was already migrated that is then deleted, will not be deleted on the destination
         */
        it('can partially migrate, then fully complete', async function() {
            // Close and re-open contexts to reset everything
            await sourceContext.close({
                clearLocal: true
            })
            await destinationContext.close({
                clearLocal: true
            })

            // Just work with the first test database
            const dbName = TEST_DBS[0]

            // Re-open application contexts
            sourceContext = await client1.openContext(SOURCE_CONTEXT_NAME)
            destinationContext = await client2.openContext(DESTINATION_CONTEXT_NAME)

            // Add a new record
            const db = await sourceContext.openDatabase(dbName)
            await db.save({record: 4})

            // Re-run the migration
            const events = migrateContext(sourceContext, destinationContext)
            const promise = new Promise((resolve, rejects) => {
                events.on('complete', () => {
                    console.log('Migration complete!')
                    resolve(true)
                })

                events.on('error', (err: any) => {
                    console.log('Migration error!')
                    console.log(err)
                    rejects(err)
                })
            })

            try {
                await promise
                assert.ok(true, 'Data migrated')
            } catch (err) {
                assert.fail(err.message)
            }

            // Verify the data in the first database is correct
            try {
                const sourceDb = await sourceContext.openDatabase(dbName, {
                    verifyEncryptionKey: false
                })
                const destinationDb = await destinationContext.openDatabase(dbName, {
                    verifyEncryptionKey: false
                })

                const sourceRows = await sourceDb.getMany()
                const destinationRows = await destinationDb.getMany()

                // Verify the same number of rows returned
                assert.equal(destinationRows.length, sourceRows.length, `${dbName}: source and destination databases have same length`)

                // Verify the same row IDs are returned
                const sourceIds = sourceRows.map((item) => item.id)
                const destinationIds = destinationRows.map((item) => item.id)
                assert.deepEqual(sourceIds, destinationIds, `${dbName}: source and destination databases have same records`)

                await sourceDb.close({
                    clearLocal: true
                })
                await destinationDb.close({
                    clearLocal: true
                })
            } catch (err) {
                assert.fail(err.message)
            }
        })
    })

    after(async () => {
        if (sourceContext) {
            for (let i in TEST_DBS) {
                const dbName = TEST_DBS[i]

                // Delete databases
                try {
                    await sourceContext.deleteDatabase(dbName)
                } catch (err) {
                    console.log(err.message)
                }

                try {
                    await destinationContext.deleteDatabase(dbName)
                } catch (err) {
                    console.log(err.message)
                }
            }

            // Close contexts
            await sourceContext.close({
                clearLocal: true
            })

            await destinationContext.close({
                clearLocal: true
            })
        }
    })
})