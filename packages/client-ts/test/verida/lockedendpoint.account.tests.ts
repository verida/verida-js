'use strict'
const assert = require('assert')

import { Client } from '../../src/index'
import { LimitedAccount, LockedEndpointAccount } from '@verida/account-node'
import CONFIG from '../config'

const DB_NAME = 'External_Locked_Endpoint'

const CONTEXT_1 = "Verida Testing: App 1"

import { sleep } from '../utils'

/**
 * 
 */
describe('Locked endpoint account tests', () => {
    let context, did1
    let context2, did2
    let rowId
    let db1

    const network = new Client({
        environment: CONFIG.ENVIRONMENT,
        didClientConfig: {
            network: CONFIG.ENVIRONMENT,
            rpcUrl: CONFIG.DID_CLIENT_CONFIG.rpcUrl
        }
    })

    const network2 = new Client({
        environment: CONFIG.ENVIRONMENT,
        didClientConfig: {
            network: CONFIG.ENVIRONMENT,
            rpcUrl: CONFIG.DID_CLIENT_CONFIG.rpcUrl
        }
    })

    describe('External access is correct', function() {
        this.timeout(60 * 1000)

        it('can open a database as owner, then open as external locked endpoint account', async function() {
            // Initialize account 1
            console.log('a')
            const account1 = new LimitedAccount({
                privateKey: CONFIG.VDA_PRIVATE_KEY,
                environment: CONFIG.ENVIRONMENT,
                didClientConfig: CONFIG.DID_CLIENT_CONFIG
            }, undefined, [CONTEXT_1])
            did1 = await account1.did()
            console.log(did1)
            await network.connect(account1)
            console.log('b')
            context = await network.openContext(CONTEXT_1, true)
            console.log('c')
            const database = db1 = await context.openDatabase(DB_NAME, {
                permissions: {
                    read: 'public',
                    write: 'public'
                }
            })
            console.log('d')

            const saveResult = await database.save({hello: 'world'})
            console.log('e')
            rowId = saveResult.id
            const info = await database.info()
            console.log(info)

            assert.ok(saveResult, 'Have a valid save result')
            const data = await database.get(rowId)
            assert.ok(data && data.hello == 'world', 'Result has expected value')

            // Initialize account 2
            console.log('f')
            const storageConfig = await account1.storageConfig(CONTEXT_1)
            console.log(storageConfig)
            let did = did1.toLowerCase()
            console.log('g')
            const consentMessage = `Do you wish to unlock this storage context: "${CONTEXT_1}"?\n\n${did}`
            const signature = await account1.sign(consentMessage)
            console.log('h')

            const auth = await info.endpoint.getAuth()
            console.log(auth)

            const authContext = {
                ...auth
            }

            // Unset refresh token to ensure only access token is used
            authContext.refreshToken = undefined

            console.log(authContext)
            console.log('i')

            const account2 = new LockedEndpointAccount({
                privateKey: CONFIG.VDA_PRIVATE_KEY_2,
                environment: CONFIG.ENVIRONMENT,
                didClientConfig: CONFIG.DID_CLIENT_CONFIG
            }, {
                did: did1,
                contextName: CONTEXT_1,
                contextConfig: storageConfig,
                contextAuths: [authContext]
            })
            console.log('j')
            did2 = await account2.did()
            console.log(did2)
            await network2.connect(account2)
            context2 = await network2.openContext(CONTEXT_1, false)
            console.log('k')

            const db2 = await context2.openExternalDatabase(DB_NAME, did2, {
                permissions: {
                    read: 'public',
                    write: 'public'
                },
                encryptionKey: info.encryptionKey,
                endpoints: [auth.endpointUri]
            })
            console.log('l')

            const data2 = await db2.get(rowId)
            assert.ok(data2 && data2.hello == 'world', 'Result has expected value')
        })
    })

    after(async () => {
        await context.close({
            clearLocal: true
        })
        await context2.close({
            clearLocal: true
        })
    })
})