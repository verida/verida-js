'use strict'
const assert = require('assert')

import { Client } from '../../src/index'
import { LimitedAccount } from '@verida/account-node'
import CONFIG from '../config'

const DB_NAME_PUBLIC_WRITE = 'ContextPublicWriteTestDb'

const CONTEXT_1 = "Verida Testing: App 1"
const CONTEXT_2 = "Verida Testing: App 2"

/**
 * 
 */
describe('Verida database tests relating to contexts', () => {
    let context, did1
    let context2, did2
    let rowId
    let db1

    const network = new Client({
        didServerUrl: CONFIG.DID_SERVER_URL,
        environment: CONFIG.ENVIRONMENT
    })

    const network2 = new Client({
        didServerUrl: CONFIG.DID_SERVER_URL,
        environment: CONFIG.ENVIRONMENT
    })

    const network3 = new Client({
        didServerUrl: CONFIG.DID_SERVER_URL,
        environment: CONFIG.ENVIRONMENT
    })

    describe('Database read / write works across contexts', function() {
        this.timeout(200000)

        it('can open a database with public write permissions', async function() {
            // Initialize account 1
            const account1 = new LimitedAccount(CONFIG.DEFAULT_ENDPOINTS, {
                privateKey: CONFIG.VDA_PRIVATE_KEY,
                didServerUrl: CONFIG.DID_SERVER_URL,
                environment: CONFIG.ENVIRONMENT
            }, [CONTEXT_1])
            did1 = await account1.did()
            await network.connect(account1)
            context = await network.openContext(CONTEXT_1, true)
            const database = db1 = await context.openDatabase(DB_NAME_PUBLIC_WRITE, {
                permissions: {
                    read: 'public',
                    write: 'public'
                }
            })

            const saveResult = await database.save({hello: 'world'})
            rowId = saveResult.id

            assert.ok(saveResult, 'Have a valid save result')
            const data = await database.get(rowId)
            assert.ok(data && data.hello == 'world', 'Result has expected value')
        })

        it('can read from an external database from a different context', async function() {
            // Initialize account 2
            const account2 = new LimitedAccount(CONFIG.DEFAULT_ENDPOINTS, {
                privateKey: CONFIG.VDA_PRIVATE_KEY_2,
                didServerUrl: CONFIG.DID_SERVER_URL,
                environment: CONFIG.ENVIRONMENT
            }, [CONTEXT_2])
            did2 = await account2.did()
            await network2.connect(account2)
            context2 = await network2.openContext(CONTEXT_2, true)

            const database = await context2.openExternalDatabase(DB_NAME_PUBLIC_WRITE, did1, {
                permissions: {
                    read: 'public',
                    write: 'public'
                },
                contextName: CONTEXT_1
            })

            assert.ok(database && database.constructor.name == 'PublicDatabase', 'Valid database instance returned')
            const data = await database.get(rowId)
            assert.ok(data && data.hello == 'world', 'Result has expected value')
        })

        it(`can write to an external database from a different context`, async function() {
            const database = await context2.openExternalDatabase(DB_NAME_PUBLIC_WRITE, did1, {
                permissions: {
                    read: 'public',
                    write: 'public'
                },
                contextName: CONTEXT_1
            })

            const result = await database.save({'write': 'from external DID'})
            assert.ok(result.id, 'Created a record with a valid ID')
            
            const data = await database.get(result.id)
            assert.ok(data, 'Fetched saved record')
            assert.ok(data.write == 'from external DID', 'Result has expected value')

            // Confirm the original database opened by DID1 & CONTEXT1 can access the saved row
            const originalDbRow = await db1.get(result.id)
            assert.ok(originalDbRow && originalDbRow.write == 'from external DID', 'Result has expected value')
        })
        
    })

})