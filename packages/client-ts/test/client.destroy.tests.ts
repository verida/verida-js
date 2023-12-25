const assert = require('assert')

import { Client } from '../src/index'
import { AutoAccount } from '@verida/account-node'
import CONFIG from './config'
import { EnvironmentType, IDatabase } from '@verida/types'

const CONTEXT_NAME = 'Verida Test: Destroyer'

const PRIVATE_KEY = ''
const ENVIRONMENT = EnvironmentType.TESTNET

let client, account, did

describe('Destroy account and context tests', function() {

    this.beforeAll(async function() {
        const localStorageNodeUri = 'http://localhost:5000/'
        
        client = new Client({
            environment: ENVIRONMENT,
            didClientConfig: {
                network: ENVIRONMENT,
            }
        })

        account = new AutoAccount({
            privateKey: PRIVATE_KEY,
            environment: ENVIRONMENT,
            didClientConfig: CONFIG.DID_CLIENT_CONFIG
        }, {
            defaultDatabaseServer: {
                type: 'VeridaDatabase',
                endpointUri: [localStorageNodeUri]
            },
            defaultMessageServer: {
                type: 'VeridaMessage',
                endpointUri: [localStorageNodeUri]
            },
        })

        await client.connect(account)
        did = await account.did()
        console.log(`DID: ${did}`)
    })

    describe.skip('Destroy stuff', () =>{

        it('can open and destroy a context', async function () {
            // open a context and save some data
            console.log('opening context')
            const context = await client.openContext(CONTEXT_NAME)

            console.log('opening database and saving data')
            const db = await context.openDatabase('testDb')
            await db.save({hello: 1})

            const info = await db.info()
            console.log(info)

            // close database
            console.log('closing databaes')
            await db.close({
                clearLocal: true
            })
            
            // close context
            console.log('closing context')
            await context.close({
                clearLocal: true
            })

            // destroy context
            console.log(`destroying context ${CONTEXT_NAME} / ${did}`)
            const endpointResults = await client.destroyContext(CONTEXT_NAME)

            for (let endpointUri in endpointResults) {
                const result = endpointResults[endpointUri]
                if (result.status == 'rejected') {
                    console.log(result.reason.response.data)
                    assert.fail(result.reason.toString())
                }
            }

            // @todo: check storage node has deleted the databases and context database correctly (checked manually). could check the context hash doesn't exist via /user/contextHash
            // @todo: check DID document doesn't have the context (checked manually)
        })

        it(`can destroy an account`, async function() {
            // open a context and save some data
            console.log('opening context')
            const context = await client.openContext(CONTEXT_NAME)

            console.log('opening database and saving data')
            const db = await context.openDatabase('testDb')
            await db.save({hello: 1})

            const info = await db.info()
            console.log(info)

            // close database
            console.log('closing database')
            await db.close({
                clearLocal: true
            })
            
            // close context
            console.log('closing context')
            await context.close({
                clearLocal: true
            })

            await client.destroyAccount()

            // @todo: check DID is deleted (checked manually)
        })
    })
})