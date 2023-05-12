'use strict'
const assert = require('assert')

import { Client } from '../src/index'
import { AutoAccount } from '@verida/account-node'
import { StorageLink } from '@verida/storage-link'
import { DIDDocument } from '@verida/did-document'
import CONFIG from './config'
import { EnvironmentType } from '@verida/types'

const TEST_DB_NAME = 'TestDb_1'
const TEST_DB_NAME_2 = 'TestDb_2'
const TEST_DB_NAME_3 = 'TestDb_3'

const ENDPOINTS = [
    'https://node1-ase1sg.gcp.acacia.verida.tech:443/',
    'https://node1-ase2id.gcp.acacia.verida.tech:443/',
    'https://node1-as1in.gcp.acacia.verida.tech:443/'
]

const DID_ENDPOINTS: string[] = []
for (let e in ENDPOINTS) {
    DID_ENDPOINTS.push(`${ENDPOINTS[e]}did/`)
}

const PRIVATE_KEY = '0x000efd2e44f0d2cbbb71506a02a2043ba45f222f04b501f139f29a0d3b21f001'
const ENVIRONMENT = EnvironmentType.TESTNET

/**
 * Test a single (or collection) of storage nodes
 */
describe('Storage node tests', () => {
    let didClient, context

    const client = new Client({
        environment: CONFIG.ENVIRONMENT,
        didClientConfig: {
            network: EnvironmentType.TESTNET,
            rpcUrl: CONFIG.DID_CLIENT_CONFIG.rpcUrl,
        }
    })

    describe('Initialize user storage contexts', function() {
        this.timeout(200 * 1000)

        it(`can connect to storage nodes`, async function() {
            const account = new AutoAccount({
                privateKey: PRIVATE_KEY,
                environment: ENVIRONMENT,
                didClientConfig: {
                    ...CONFIG.DID_CLIENT_CONFIG,
                    didEndpoints: DID_ENDPOINTS
                }
            })
            await client.connect(account)
            await account.setAccountConfig({
                defaultDatabaseServer: {
                    type: 'VeridaDatabase',
                    endpointUri: ENDPOINTS,
                },
                defaultMessageServer: {
                    type: 'VeridaMessage',
                    endpointUri: ENDPOINTS,
                }
            })
            didClient = await account.getDidClient()
            const did = await account.did()

            console.log(`Opening context for DID: ${did}`)
            context = await client.openContext(CONFIG.CONTEXT_NAME, true)
            assert.ok(context, 'Account context opened')
            console.log(`Context opened`)

            console.log(`Attempting to open a database`)
            const database = await context.openDatabase(TEST_DB_NAME)

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
        })
    })

    after(async () => {
        await context.close({
            clearLocal: true
        })
    })
})