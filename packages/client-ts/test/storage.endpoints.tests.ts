const assert = require('assert')

import { Client } from '../src/index'
import { AutoAccount } from '@verida/account-node'
import { StorageLink } from '@verida/storage-link'
import { DIDDocument } from '@verida/did-document'
import { Wallet } from 'ethers'
import CONFIG from './config'

const TEST_DB_NAME = 'TestDb_1'

const ENDPOINT_1 = 'http://localhost:5000/'
const ENDPOINT_2 = 'https://acacia-dev1.tn.verida.tech/'

const DEFAULT_ENDPOINTS = {
    defaultDatabaseServer: {
        type: 'VeridaDatabase',
        endpointUri: [ENDPOINT_1, ENDPOINT_2]
    },
    defaultMessageServer: {
        type: 'VeridaMessage',
        endpointUri: [ENDPOINT_1, ENDPOINT_2]
    },
},

const wallet = Wallet.createRandom()
const address = wallet.address.toLowerCase()
const did = `did:vda:testnet:${address}`

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
        privateKey: CONFIG.VDA_PRIVATE_KEY,
        environment: CONFIG.ENVIRONMENT,
        didClientConfig: CONFIG.DID_CLIENT_CONFIG
    })

    describe('Initialize user storage contexts', function() {
        this.timeout(100 * 1000)

        it(`can open a user storage context`, async function() {
            await client.connect(account)
            didClient = await account.getDidClient()
            const did = await account.did()

            await StorageLink.unlink(didClient, CONFIG.CONTEXT_NAME)

            context = await client.openContext(CONFIG.CONTEXT_NAME, true)
            assert.ok(context, 'Account context opened')

            const fetchedStorageConfig = await StorageLink.getLink(didClient, did, CONFIG.CONTEXT_NAME)
            const contextConfig = await context.getContextConfig()

            contextConfig.id = DIDDocument.generateContextHash(did, CONFIG.CONTEXT_NAME)
            assert.deepEqual(fetchedStorageConfig, contextConfig, 'Storage context config matches')
        })

        it('can write data to both endpoints', async function() {
            const database = await context.openDatabase(TEST_DB_NAME)

            const LIMIT = 10
            for (let i=0; i++; i < LIMIT) {
                await database.save({'hello': 'world'})
            }

            const ENDPOINTS =[ENDPOINT_1, ENDPOINT_1]
            const results = {}
            const info = {}
            const usage = {}
            const databaseList = {}
            for (let endpoint in ENDPOINTS) {
                const endpointUri = endpoint
                const dbConnection = database.dbConnections[endpointUri]
                // @todo: this is wrong, look at pouchdb docs
                 const data = await dbConnection.allDocs({include_docs: true})

                // Confirm base data is correct
                assert.ok(data, 'Base database: Data returned')
                assert.ok(data.length && data.length == LIMIT, `Base database: Array returned with ${LIMIT} rows`)
                assert.ok(data[0].hello == 'world', 'Base database: First result has expected value')

                results[endpointUri] = data
                info[endpointUri] = await dbConnection.info()
                usage[endpointUri] = await database.getEndpoints()[endpointUri].usage()
                databaseList[endpointUri] = await database.getEndpoints()[endpointUri].databases()
            }

            // Confirm database data matches
            assert.deepEqual(results[ENDPOINT_1], results[ENDPOINT_2], 'Endpoints have the same data')

            // Confirm database info matches
            assert.deepEqual(info[ENDPOINT_1], info[ENDPOINT_2], 'Endpoints have the same info')

            // Confirm database usage matches
            assert.deepEqual(usage[ENDPOINT_1], usage[ENDPOINT_2], 'Endpoints have the same usage stats')

            // Confirm database usage matches
            assert.deepEqual(databaseList[ENDPOINT_1], databaseList[ENDPOINT_2], 'Endpoints have the same database list')
        })

        // @todo: check permission updates propogate correctly

        // @todo: add a new endpoint, let it sync then perform the same tests across all the endpoints

        // @todo: write data to the second endpoint and perform tests across all the endpoints
        
    })
})