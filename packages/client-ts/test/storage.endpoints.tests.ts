const assert = require('assert')

import { Client } from '../src/index'
import { AutoAccount } from '@verida/account-node'
import { StorageLink } from '@verida/storage-link'
import { DIDDocument } from '@verida/did-document'
import Utils from "../src/context/engines/verida/database/utils";
//import { Wallet } from 'ethers'
import CONFIG from './config'
import { sleep } from './utils'

const TEST_DB_NAME = 'TestDb_3'
const TEST_DB_NAME_USERS = 'TestDb_Users_3'
const TEST_DB_NAME_PUBLIC = 'TestDb_Public_3'
const TEST_CONTEXT_NAME = 'Verida Test: Storage Endpoint Tests 2'

const ENDPOINT_1 = 'http://192.168.68.118:5000'
const ENDPOINT_2 = 'http://192.168.68.117:5000'

const PRIVATE_KEY = '0x1dddebf238759ca069cab321795c054a005a0d51dfa39e2b270c0ba0d07b107c'
const DID1 = 'did:vda:testnet:0x50e4A90EC6Ef9B0638cbed992DE32951466c8D6b'
const DID2 = 'did:vda:testnet:0x7A7d42d4b79B801C41ED34117BcED36319818A78'

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

/**
 * These tests are skipped because they are designed to be run against a local set of storage nodes
 */
describe.skip('Storage endpoint tests', () => {
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

        it(`can write data`, async () => {
            const database = await context.openDatabase(TEST_DB_NAME)
            const currentData = await database.getMany()

            const LIMIT = 10
            if (currentData.length === 0) {
                for (let i=0; i < LIMIT; i++) {
                    await database.save({'hello': 'world'})
                }
            }
        })

        it(`verify databases match`, async () => {
            const did = await account.did()
            const engine = await context.getDatabaseEngine(did, true)
            assert.ok(engine, `Have database engine`)
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

        it('can write data to second endpoint and it syncs', async function() {
            const database = await context.openDatabase(TEST_DB_NAME_PUBLIC, {
                permissions: {
                    read: 'public',
                    write: 'public'
                }
            })

            // write data to both nodes
            const rows = await database.getMany()
            if (rows.length == 0) {
                console.log('No data in users database, populating...')
                await database.save({'hello': 'world'})
                //console.log('Delay for 5 seconds, giving time to sync')
                await sleep(5 * 1000)
            }

            // determine primary and secondary connections
            const connections = database.dbConnections
            const primaryConnection = database.db
            let secondaryConnection
            for (let i in connections) {
                if (connections[i] != primaryConnection) {
                    secondaryConnection = connections[i]
                    break
                }
            }

            const docs1 = await primaryConnection.allDocs({include_docs: true})
            const docs2 = await secondaryConnection.allDocs({include_docs: true})

            assert.deepEqual(docs1.rows, docs2.rows, 'Rows on both databases match')

            // Write random data to the second endpoint and perform tests across all the endpoints
            const randInt = Utils.getRandomInt(0, 1000000)
            const res = await secondaryConnection.post({'second': randInt})
            await sleep(5*1000)
            
            const res1 = await primaryConnection.get(res.id)
            const res2 = await secondaryConnection.get(res.id)

            assert.deepEqual(res1, res2, 'Rows on both databases match')
        })

        it('can update permissions and they propogate correctly', async function() {
            const database = await context.openDatabase(TEST_DB_NAME_USERS, {
                permissions: {
                    read: 'users',
                    write: 'users',
                    readList: [],
                    writeList: [],
                }
            })

            await database.updateUsers([DID1], [DID1])

            const endpoints = database.endpoints
            const dbInfo1 = await endpoints[ENDPOINT_1].getDatabaseInfo(TEST_DB_NAME_USERS)
            const dbInfo2 = await endpoints[ENDPOINT_2].getDatabaseInfo(TEST_DB_NAME_USERS)

            delete dbInfo1['info']
            delete dbInfo2['info']

            assert.deepEqual(dbInfo1, dbInfo2, 'Database info, including permissions, are equal')
            assert.deepEqual(dbInfo1.permissions, {
                read: 'users',
                write: 'users',
                readList: [DID1],
                writeList: [DID1]
            }, 'Permissions have a single DID')

            await database.updateUsers([DID1, DID2], [DID1, DID2])

            const dbInfo3 = await endpoints[ENDPOINT_1].getDatabaseInfo(TEST_DB_NAME_USERS)
            const dbInfo4 = await endpoints[ENDPOINT_2].getDatabaseInfo(TEST_DB_NAME_USERS)

            delete dbInfo3['info']
            delete dbInfo4['info']

            assert.deepEqual(dbInfo3, dbInfo4, 'Database info, including permissions, are equal')
            assert.deepEqual(dbInfo3.permissions, {
                read: 'users',
                write: 'users',
                readList: [DID1, DID2],
                writeList: [DID1, DID2]
            }, 'Permissions have two DIDs')
        })

        // @todo: add a new endpoint, let it sync then perform the same tests across all the endpoints
        
    })
})