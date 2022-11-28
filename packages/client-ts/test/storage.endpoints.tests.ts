const assert = require('assert')

import { Client } from '../src/index'
import { AutoAccount } from '@verida/account-node'
import { StorageLink } from '@verida/storage-link'
import { DIDDocument } from '@verida/did-document'
//import { Wallet } from 'ethers'
import CONFIG from './config'

const TEST_DB_NAME = 'TestDb_1_5'
const TEST_CONTEXT_NAME = 'Verida Test: Storage Endpoint Tests 1'

const ENDPOINT_1 = 'http://192.168.68.118:5000/'
const ENDPOINT_2 = 'http://192.168.68.117:5000/'

const DEFAULT_ENDPOINTS = {
    defaultDatabaseServer: {
        type: 'VeridaDatabase',
        endpointUri: [ENDPOINT_1, ENDPOINT_2]
    },
    defaultMessageServer: {
        type: 'VeridaMessage',
        endpointUri: [ENDPOINT_1, ENDPOINT_2]
    },
}

export function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
  }

// @TODO: Create new DID
//const wallet = Wallet.createRandom()
//const address = wallet.address.toLowerCase()

const PRIVATE_KEY = '0x6ea94649d8a826ddda7992c1200ccf632577f91245b920d8f2468fd18c969cd0'
//const did = `did:vda:testnet:${address}`

/**
 * 
 */
describe('Storage endpoint tests', () => {
    let didClient, context

    const client = new Client({
        environment: CONFIG.ENVIRONMENT,
        didClientConfig: {
            rpcUrl: CONFIG.DID_CLIENT_CONFIG.rpcUrl
        }
    })

    const account = new AutoAccount(DEFAULT_ENDPOINTS, {
        privateKey: PRIVATE_KEY,
        environment: CONFIG.ENVIRONMENT,
        didClientConfig: CONFIG.DID_CLIENT_CONFIG
    })

    describe('Initialize user storage contexts', function() {
        this.timeout(100 * 1000)

        it(`can open a user storage context`, async function() {
            await client.connect(account)
            didClient = await account.getDidClient()
            const did = await account.did()

            context = await client.openContext(TEST_CONTEXT_NAME, true)
            assert.ok(context, 'Account context opened')

            const fetchedStorageConfig = await StorageLink.getLink(didClient, did, TEST_CONTEXT_NAME)
            const contextConfig = await context.getContextConfig()

            contextConfig.id = DIDDocument.generateContextHash(did, TEST_CONTEXT_NAME)
            assert.deepEqual(fetchedStorageConfig, contextConfig, 'Storage context config matches')
        })

        it('can write data to both endpoints', async function() {
            const database = await context.openDatabase(TEST_DB_NAME)
            const currentData = await database.getMany()

            const LIMIT = 10
            if (currentData.length === 0) {
                for (let i=0; i < LIMIT; i++) {
                    await database.save({'hello': 'world'})
                }
            }

            //console.log('Delay for 5 seconds, giving time to sync')
            await sleep(5 * 1000)

            const ENDPOINTS = [ENDPOINT_1, ENDPOINT_2]
            const results = {}
            const pouchInfo = {}
            const info = {}
            const usage = {}
            const databaseList = {}

            const endpoints = await database.getEndpoints()

            for (let i in ENDPOINTS) {
                const endpointUri = ENDPOINTS[i]
                const dbConnection = database.dbConnections[endpointUri]
                const data = await dbConnection.allDocs({include_docs: true, limit: 50})

                // Confirm base data is correct
                assert.ok(data && data.rows, 'Base database: Data returned')
                assert.ok(data.rows.length && data.rows.length >= LIMIT, `Base database: Array returned with at least ${LIMIT} rows (${data.rows.length})`)
                assert.ok(data.rows[0].doc.payload, 'Base database: First result has an encrypted value')

                results[endpointUri] = data
                const pouchData = await dbConnection.info()
                pouchInfo[endpointUri] = {
                    db_name: pouchData.db_name,
                    purge_seq: pouchData.purge_seq,
                    update_seq: pouchData.update_seq,
                    doc_del_count: pouchData.doc_del_count,
                    doc_count: pouchData.doc_count
                }

                const dbInfo = await endpoints[endpointUri].getDatabaseInfo(TEST_DB_NAME)
                info[endpointUri] = {
                    did: dbInfo.did,
                    contextName: dbInfo.contextName,
                    databaseName: dbInfo.databaseName,
                    db_name: dbInfo.info.db_name,
                    purge_seq: dbInfo.info.purge_seq,
                    update_seq: dbInfo.info.update_seq,
                    doc_del_count: dbInfo.info.doc_del_count,
                    doc_count: dbInfo.info.doc_count
                }

                //usage[endpointUri] = await endpoints[endpointUri].getUsage()
                databaseList[endpointUri] = await endpoints[endpointUri].getDatabases()
            }

            // Confirm pouch data matches
            // console.log(results)
            assert.deepEqual(results[ENDPOINT_1], results[ENDPOINT_2], 'Endpoints have the same data')

            // Confirm database info matches
            // console.log(pouchInfo)
            assert.deepEqual(pouchInfo[ENDPOINT_1], pouchInfo[ENDPOINT_2], 'Endpoints have the same pouch info')

            // Confirm database info matches
            // console.log(info)
            assert.deepEqual(info[ENDPOINT_1], info[ENDPOINT_2], 'Endpoints have the same database info')

            // Confirm database usage matches
            // console.log(databaseList)
            assert.deepEqual(databaseList[ENDPOINT_1], databaseList[ENDPOINT_2], 'Endpoints have the same database list')

            // Confirm database usage matches
            // Note: Often small discrepancies, so this tst is ignroed
            // console.log(usage)
            //assert.deepEqual(usage[ENDPOINT_1], usage[ENDPOINT_2], 'Endpoints have the same usage stats')
        })

        // @todo: check permission updates propogate correctly

        // @todo: add a new endpoint, let it sync then perform the same tests across all the endpoints

        // @todo: write data to the second endpoint and perform tests across all the endpoints
        
    })
})