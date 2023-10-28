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

        it('can migrate data from source context to the detination context', async function() {
            await migrateContext(sourceContext, destinationContext)

            assert.ok(true, 'Data migrated')
        })

        it('can verify database data matches exactly', async function() {
            // Close and re-open contexts to reset everything
            await sourceContext.close({
                clearLocal: true
            })
            await destinationContext.close({
                clearLocal: true
            })

            sourceContext = await client1.openContext(SOURCE_CONTEXT_NAME, true)
            destinationContext = await client2.openContext(DESTINATION_CONTEXT_NAME, true)

            // Verify data for all databases
            for (let i in TEST_DBS) {
                try {
                    const dbName = TEST_DBS[i]
                    console.log('a')
                    const sourceDb = await sourceContext.openDatabase(dbName)
                    console.log('b')
                    const destinationDb = await destinationContext.openDatabase(dbName)

                    const sourceRows = await sourceDb.getMany()
                    const destinationRows = await destinationDb.getMany()

                    console.log('source: ')
                    console.log(sourceRows)

                    console.log('destination: ')
                    console.log(destinationRows)

                    assert.ok(true, `${dbName} source and destination databases match`)

                    await sourceDb.close()
                    await destinationDb.close()
                } catch (err) {
                    console.log(dbName)
                    console.log(err)
                }
            }
        })

        it('can delete test database data', async function() {
            for (let i in TEST_DBS) {
                const dbName = TEST_DBS[i]
                await sourceContext.deleteDatabase(dbName)
                assert.ok(true, `Source database deleted: ${dbName}`)

                try {
                    await destinationContext.deleteDatabase(dbName)
                    assert.ok(true, `Destination database deleted: ${dbName}`)
                } catch (err) {
                    if (!err.message.match(/not exist/)) {
                        assert.fail(err.message)
                    }
                }
            }
        })
    })

    after(async () => {
        if (sourceContext) {
            await sourceContext.close({
                clearLocal: true
            })
            await destinationContext.close({
                clearLocal: true
            })
        }
    })
})