'use strict'
const assert = require('assert')

import { Client } from '../../src/index'
import { AutoAccount, AuthContextAccount } from '@verida/account-node'
import CONFIG from '../config'

const DB_NAME_OWNER = 'OwnerTestDb_1'
const DB_NAME_OWNER_2 = 'OwnerTestDb_2'

const VALID_CONTEXT = 'Verida Testing: Authentication'
const INVALID_CONTEXT = 'Verida Testing: Authentication - Invalid'


/**
 * 
 *
 */
describe('Verida auth tests', () => {
    let context, did
    let invalidContext, invalidDid

    const account = new AutoAccount(CONFIG.DEFAULT_ENDPOINTS, {
        privateKey: CONFIG.VDA_PRIVATE_KEY,
        didServerUrl: CONFIG.DID_SERVER_URL,
        environment: CONFIG.ENVIRONMENT
    })

    const network = new Client({
        didServerUrl: CONFIG.DID_SERVER_URL,
        environment: CONFIG.ENVIRONMENT
    })

    const network2 = new Client({
        didServerUrl: CONFIG.DID_SERVER_URL,
        environment: CONFIG.ENVIRONMENT
    })

    const invalidAccount = new AutoAccount(CONFIG.INVALID_ENDPOINTS, {
        privateKey: CONFIG.VDA_PRIVATE_KEY,
        didServerUrl: CONFIG.DID_SERVER_URL,
        environment: CONFIG.ENVIRONMENT
    })

    const invalidNetwork = new Client({
        didServerUrl: CONFIG.DID_SERVER_URL,
        environment: CONFIG.ENVIRONMENT
    })

    describe('Handle authentication errors', function() {
        this.timeout(200000)

        // Handle errors where the storage node API is down, so unable to authenticate
        it('can handle authentication connection error', async function() {
            invalidDid = await invalidAccount.did()
            await invalidNetwork.connect(invalidAccount)
            invalidContext = await invalidNetwork.openContext(INVALID_CONTEXT, true)

            const promise = new Promise((resolve, rejects) => {
                invalidContext.openDatabase(DB_NAME_OWNER).then(rejects, resolve)
            })
            const result = await promise

            const expectedMessage = `Unable to connect to storage node (http://localhost:6000/): connect ECONNREFUSED 127.0.0.1:6000`
            assert.deepEqual(result, new Error(expectedMessage))
        })
    })
    
    describe('Handle token expiry', function() {
        this.timeout(200000)

        it('can handle accessToken expiry for an encrypted database', async function() {
            // Create a working connection
            did = await account.did()
            await network.connect(account)
            context = await network.openContext(VALID_CONTEXT, true)

            // 1/ get the context auth
            const authContext = await context.getAuthContext()

            // Manually set to an invalid access token so the refreshToken is needed to re-authenticate
            authContext.accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImVIUTlLTFprbE9UVERjaU1TOXFOY1Nzb0hBUUJSbUxDbEQ3d2pDUnBsSXNSUE45emZMdHBSM0JlM3d0cXRVVHlFakVPcVhpS2NZeG5zZHBWWTlWRWE3TmUwNUtsUElPUTQxSlpJQktHWW1NYjE2ajRkWkZxVThlek1VZFR1SnRFYmNKUlY0M09JWXE4OTF0ZXY0TDhKY2xPdzBZV1BweTFoMmpKTHkzblNJNVZsZ3RaVG1HVmI5cXlDODRrVnd1NGsySzVvN1VuOFkyUmNWbGpEa2lZRXpaanBxbzlkc0l4Mkh0UGNQcE9TVDhVM05WU29TWjFibzNBdU5CRjkxbE4iLCJkaWQiOiJkaWQ6dmRhOjB4ZTcwZTYyODQyNzg4MGFiMDFiZTU1YTM0OWYxY2VmMDQ3OWIyMWJmOCIsInN1YiI6InZmNWYxOWYyYzcyYTFmNDllYjcwMDIxNWMwNGVhMGM4NjVmMjc4ZTA4MGNkMDU5Njc4NjVhMmE5MTA0YWUzNjUzIiwiY29udGV4dE5hbWUiOiJWZXJpZGEgVGVzdGluZzogQXV0aGVudGljYXRpb24iLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNjYxNDE5ODQ2LCJleHAiOjE2NjE0MTk5MDZ9.tHugqMHM_udE-eV0u2_2oCjzDSiljfK8DVieK-GcXcU'
            
            // 2/ initialise a new testing account that has a single context with no access token
            const account2 = new AuthContextAccount(CONFIG.DEFAULT_ENDPOINTS, {
                privateKey: CONFIG.VDA_PRIVATE_KEY,
                didServerUrl: CONFIG.DID_SERVER_URL,
                environment: CONFIG.ENVIRONMENT
            },
            VALID_CONTEXT,
            authContext)

            // 3/ initiate a new context using the context auth
            await network2.connect(account2)
            const context2 = await network2.openContext(VALID_CONTEXT)

            // 4/ Create a new context which will use the refresh token to create a new access token
            const db2 = await context2?.openDatabase(DB_NAME_OWNER, {
                saveDatabase: false
            })

            assert.ok(db2, 'Have successfully opened a database')

            const rows = await db2!.getMany()
            assert.ok(rows && rows.length, 'Have valid results returned')
        })

        // todo: test with public database, not encrypted database

        /*it('can handle refreshToken expiry', async function() {
            // Create a working connection
            did = await account.did()
            await network.connect(account)
            context = await network.openContext(VALID_CONTEXT, true)
            const db = await context.openDatabase(DB_NAME_OWNER)

            // 1/ get the context auth
            const authContext = await context.getAuthContext()
            console.log(authContext)

            // Manually invalidate the access token so the refreshToken is needed to re-authenticate
            authContext.accessToken = ''
            
            // 2/ initialise a new testing account that has no ability to fetch auth contexts
            //      and just uses the context specified in the constructor
            const account2 = new AuthContextAccount(CONFIG.DEFAULT_ENDPOINTS, {
                privateKey: CONFIG.VDA_PRIVATE_KEY,
                didServerUrl: CONFIG.DID_SERVER_URL,
                environment: CONFIG.ENVIRONMENT
            },
            [VALID_CONTEXT],
            authContext)

            // 3/ initiate a new context using the context auth
            await network2.connect(account2)
            const context2 = await network2.openContext(VALID_CONTEXT)
            console.log('got new context')

            // 4/ Manually invalidate the refresh token on the storage node
            const disconnect = await account.disconnectDevice(VALID_CONTEXT)
            assert.ok(disconnect, 'Device disconnected')

            // 5/ Create a new context which will attempt to use the refresh token
            // which has been deleted, which should fail
            const db2 = await context2?.openDatabase(DB_NAME_OWNER)
            await db2?.getDb()
        })*/
    })
})