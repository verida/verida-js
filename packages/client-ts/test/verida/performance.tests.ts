const assert = require('assert')
import { Wallet } from 'ethers'
import { Client } from '../../src/index'
import { AutoAccount } from '@verida/account-node'
const { performance } = require("perf_hooks")
import CONFIG from '../config'

const wallet = Wallet.createRandom()
const ADDRESS = wallet.address.toLowerCase()
const DID = `did:vda:testnet:${ADDRESS}`
const PRIVATE_KEY = wallet.privateKey

console.log(`
ADDRESS: ${ADDRESS}
DID: ${DID}
PRIVATE_KEY: ${PRIVATE_KEY}
`)

const TEST_CONTEXT_NAME = 'Verida Tests: Performance'
const TEST_CONTEXT_NAME_2 = 'Verida Tests: Performance2'
const TEST_DB_NAME = 'Test Db'
const TEST_DB_NAME_2 = 'Test Db2'

/**
 * Important: Your location relative to the nodes makes a very big difference in the performance as the protocol is quite chatty.
 * 
 * Performance notes:
 * 
 * 1. Opening a context on a new DID takes a long time as the DID needs to be created (add to blockchain and endpoints)
 * 2. Opening a context on an existing DID takes time because the DID doc needs to be updated on all endpoints to specify the new context
 * 3. Opening a new database takes time (connect account, check account replication, create database on all endpoints,
 *      initialise replication, check database info, get records to confirm encryption key is correct)
 */
describe.skip('Performance tests', () => {
    const client1 = new Client({
        environment: CONFIG.ENVIRONMENT,
        didClientConfig: {
            rpcUrl: CONFIG.DID_CLIENT_CONFIG.rpcUrl
        }
    })
    let context1

    const account1 = new AutoAccount({
        privateKey: PRIVATE_KEY,
        environment: CONFIG.ENVIRONMENT,
        didClientConfig: CONFIG.DID_CLIENT_CONFIG
    })

    const client2 = new Client({
        environment: CONFIG.ENVIRONMENT,
        didClientConfig: {
            rpcUrl: CONFIG.DID_CLIENT_CONFIG.rpcUrl
        }
    })
    let context2, context3

    const account2 = new AutoAccount({
        privateKey: PRIVATE_KEY,
        environment: CONFIG.ENVIRONMENT,
        didClientConfig: CONFIG.DID_CLIENT_CONFIG
    })

    describe('Basic tests', function() {
        this.timeout(120 * 1000)

        it('can create a new account in a performant way', async () => {
            const tCreateAccount = performance.now()
            // Creates a new DID
            await client1.connect(account1)
            context1 = await client1.openContext(TEST_CONTEXT_NAME, true)
            const tCreateAccountDone = performance.now()

            // Creates a new context
            const db1 = await context1.openDatabase(TEST_DB_NAME)
            await db1.save({hello: 'world'})
            const tCreateAccountDbSave = performance.now()

            const createAccountTotal = (tCreateAccountDone-tCreateAccount)
            const createAccountDbSaveTotal = (tCreateAccountDbSave-tCreateAccountDone)

            console.log(`Create account new context time: ${createAccountTotal} ms`)
            console.log(`Create account new context database time: ${createAccountDbSaveTotal} ms`)

            assert.ok(createAccountTotal < 60*1000, `Create account new context time (${Math.round(createAccountTotal/1000.0)}s) is < 60s`)
            assert.ok(createAccountDbSaveTotal < 30*1000, `Create account new context database time (${Math.round(createAccountDbSaveTotal/1000.0)}s) on a new account is < 30s`)
        })

        /**
         * Open an existing application context and database
         */
        it('can open an existing context in a performant way', async () => {
            const tOpenContext = performance.now()
            await client2.connect(account2)
            context2 = await client2.openContext(TEST_CONTEXT_NAME, true)
            const tOpenContextDone = performance.now()

            const db1 = await context2.openDatabase(TEST_DB_NAME)
            await db1.save({hello2: 'world2'})
            const tOpenContextDbSave = performance.now()

            const openContextTotal = (tOpenContextDone-tOpenContext)
            const openContextDbSaveTotal = (tOpenContextDbSave-tOpenContextDone)

            console.log(`Open existing context time: ${openContextTotal} ms`)
            console.log(`Open existing context + existing DB time: ${openContextDbSaveTotal} ms`)

            assert.ok(openContextTotal < 5*1000, `Open existing context time (${Math.round(openContextTotal/1000.0)}s) is < 5s`)
            assert.ok(openContextDbSaveTotal < 5*1000, `Open existing context + existing database time (${Math.round(openContextDbSaveTotal/1000.0)}s) on a new account is < 5s`)
        })

        /**
         * Open a new application context and database for an existing DID
         */
        it('can open a new context in a performant way', async () => {
            const tOpenContext = performance.now()
            context3 = await client2.openContext(TEST_CONTEXT_NAME_2, true)
            const tOpenContextDone = performance.now()

            const db1 = await context3.openDatabase(TEST_DB_NAME)
            await db1.save({hello2: 'world2'})
            const tOpenContextDbSave = performance.now()

            const openContextTotal = (tOpenContextDone-tOpenContext)
            const openContextDbSaveTotal = (tOpenContextDbSave-tOpenContextDone)

            console.log(`Open new context time: ${openContextTotal} ms`)
            console.log(`Open new context + new DB time: ${openContextDbSaveTotal} ms`)

            assert.ok(openContextTotal < 10*1000, `Open new context time (${Math.round(openContextTotal/1000.0)}s) is < 10s`)
            assert.ok(openContextDbSaveTotal < 10*1000, `Open new context database time (${Math.round(openContextDbSaveTotal/1000.0)}s) on a new account is < 10s`)
        })

        /**
         * Open a new database on an already open application context
         */
        it('can open a new database on open context in a performant way', async () => {
            const tOpenDb = performance.now()
            const db1 = await context3.openDatabase(TEST_DB_NAME_2)
            await db1.save({hello2: 'world2'})
            const tOpenDbSave = performance.now()

            const openDbTotal = (tOpenDbSave-tOpenDb)

            console.log(`Open new database on open context time: ${openDbTotal} ms`)

            assert.ok(openDbTotal < 5*1000, `Open new database on open context time (${Math.round(openDbTotal/1000.0)}s) is < 5s`)
        })

        
    })

    after(async () => {
        await context1.close({
            clearLocal: true
        })
        await context2.close({
            clearLocal: true
        })
        await context3.close({
            clearLocal: true
        })
    })
})