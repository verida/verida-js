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
 * Note: These tests will fail unless they are run against a localhost storage node server.
 * 
 * They are skipped by default
 */
describe.skip('Verida auth tests', () => {
    let invalidContext, invalidDid

    const account = new AutoAccount({
        privateKey: CONFIG.VDA_PRIVATE_KEY,
        environment: CONFIG.ENVIRONMENT,
        didClientConfig: CONFIG.DID_CLIENT_CONFIG
    })

    const invalidAccount = new AutoAccount({
        privateKey: CONFIG.VDA_PRIVATE_KEY,
        environment: CONFIG.ENVIRONMENT,
        didClientConfig: CONFIG.DID_CLIENT_CONFIG
    })

    const invalidNetwork = new Client({
        didClientConfig: {
            network: CONFIG.ENVIRONMENT,
            rpcUrl: CONFIG.DID_CLIENT_CONFIG.rpcUrl
        },
        environment: CONFIG.ENVIRONMENT
    })

    describe('Handle authentication errors', function() {
        this.timeout(100000)

        // Handle errors where the storage node API is down, so unable to authenticate
        it('can handle authentication connection error', async function() {
            invalidDid = await invalidAccount.did()
            await invalidNetwork.connect(invalidAccount)
            invalidContext = await invalidNetwork.openContext(INVALID_CONTEXT, true)

            const promise = new Promise(async (resolve, rejects) => {
                try {
                    await invalidContext.openDatabase(DB_NAME_OWNER)
                } catch (err) {
                    // Expect a connection error
                    resolve(err)
                }
            })

            const result = await promise
            const expectedMessage = `Unable to connect to storage node (http://localhost:6000/): connect ECONNREFUSED 127.0.0.1:6000`
            assert.deepEqual(result, new Error(expectedMessage))
        })
    })
    
    describe('Handle token expiry', function() {
        this.timeout(100000)

        it('can handle accessToken expiry for an encrypted database', async function() {
            // Create a working connection
            const network = new Client({
                didClientConfig: {
                    network: CONFIG.ENVIRONMENT,
                    rpcUrl: CONFIG.DID_CLIENT_CONFIG.rpcUrl
                },
                environment: CONFIG.ENVIRONMENT
            })
        
            const network2 = new Client({
                didClientConfig: {
                    network: CONFIG.ENVIRONMENT,
                    rpcUrl: CONFIG.DID_CLIENT_CONFIG.rpcUrl
                },
                environment: CONFIG.ENVIRONMENT
            })

            await network.connect(account)
            const context = await network.openContext(VALID_CONTEXT, true)

            const db1 = await context!.openDatabase(DB_NAME_OWNER, {
                saveDatabase: false
            })
            const row = await db1.save({'hello': 'world'})

            // 1/ get the context auth
            const did = await account.did()
            // @ts-ignore
            const authContext = context.databaseEngines[did].endpoints['http://localhost:5000/'].auth

            // Manually set to an invalid access token so the refreshToken is needed to re-authenticate
            authContext.accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImVIUTlLTFprbE9UVERjaU1TOXFOY1Nzb0hBUUJSbUxDbEQ3d2pDUnBsSXNSUE45emZMdHBSM0JlM3d0cXRVVHlFakVPcVhpS2NZeG5zZHBWWTlWRWE3TmUwNUtsUElPUTQxSlpJQktHWW1NYjE2ajRkWkZxVThlek1VZFR1SnRFYmNKUlY0M09JWXE4OTF0ZXY0TDhKY2xPdzBZV1BweTFoMmpKTHkzblNJNVZsZ3RaVG1HVmI5cXlDODRrVnd1NGsySzVvN1VuOFkyUmNWbGpEa2lZRXpaanBxbzlkc0l4Mkh0UGNQcE9TVDhVM05WU29TWjFibzNBdU5CRjkxbE4iLCJkaWQiOiJkaWQ6dmRhOjB4ZTcwZTYyODQyNzg4MGFiMDFiZTU1YTM0OWYxY2VmMDQ3OWIyMWJmOCIsInN1YiI6InZmNWYxOWYyYzcyYTFmNDllYjcwMDIxNWMwNGVhMGM4NjVmMjc4ZTA4MGNkMDU5Njc4NjVhMmE5MTA0YWUzNjUzIiwiY29udGV4dE5hbWUiOiJWZXJpZGEgVGVzdGluZzogQXV0aGVudGljYXRpb24iLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNjYxNDE5ODQ2LCJleHAiOjE2NjE0MTk5MDZ9.tHugqMHM_udE-eV0u2_2oCjzDSiljfK8DVieK-GcXcU'

            // 2/ initialise a new testing account that has a single context with an invalid access token
            const account2 = new AuthContextAccount({
                    privateKey: CONFIG.VDA_PRIVATE_KEY,
                    didClientConfig: CONFIG.DID_CLIENT_CONFIG,
                    environment: CONFIG.ENVIRONMENT
                },
                VALID_CONTEXT,
                authContext
            )

            // 3/ initiate a new context using the context auth
            await network2.connect(account2)
            const context2 = await network2.openContext(VALID_CONTEXT)

            // 4/ Create a new context which will use the refresh token to create a new access token
            const db2 = await context2!.openDatabase(DB_NAME_OWNER, {
                saveDatabase: false
            })

            assert.ok(db2, 'Have successfully opened a database')

            const rows = await db2!.getMany()
            assert.ok(rows && rows.length, 'Have valid results returned')
        })

        it('can handle refreshToken expiry for an encrypted database', async function() {
            // Create a working connection
            const network = new Client({
                didClientConfig: {
                    network: CONFIG.ENVIRONMENT,
                    rpcUrl: CONFIG.DID_CLIENT_CONFIG.rpcUrl
                },
                environment: CONFIG.ENVIRONMENT
            })
        
            const network2 = new Client({
                didClientConfig: {
                    network: CONFIG.ENVIRONMENT,
                    rpcUrl: CONFIG.DID_CLIENT_CONFIG.rpcUrl
                },
                environment: CONFIG.ENVIRONMENT
            })
            
            await network.connect(account)
            const context = await network.openContext(VALID_CONTEXT, true)
            await context!.openDatabase(DB_NAME_OWNER, {})

            // 1/ get the context auth
            const did = await account.did()
            // @ts-ignore
            const authContext = context.databaseEngines[did].endpoints['http://localhost:5000/'].auth

            // Manually set to an invalid access token so the refreshToken is needed to re-authenticate
            authContext.accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImVIUTlLTFprbE9UVERjaU1TOXFOY1Nzb0hBUUJSbUxDbEQ3d2pDUnBsSXNSUE45emZMdHBSM0JlM3d0cXRVVHlFakVPcVhpS2NZeG5zZHBWWTlWRWE3TmUwNUtsUElPUTQxSlpJQktHWW1NYjE2ajRkWkZxVThlek1VZFR1SnRFYmNKUlY0M09JWXE4OTF0ZXY0TDhKY2xPdzBZV1BweTFoMmpKTHkzblNJNVZsZ3RaVG1HVmI5cXlDODRrVnd1NGsySzVvN1VuOFkyUmNWbGpEa2lZRXpaanBxbzlkc0l4Mkh0UGNQcE9TVDhVM05WU29TWjFibzNBdU5CRjkxbE4iLCJkaWQiOiJkaWQ6dmRhOjB4ZTcwZTYyODQyNzg4MGFiMDFiZTU1YTM0OWYxY2VmMDQ3OWIyMWJmOCIsInN1YiI6InZmNWYxOWYyYzcyYTFmNDllYjcwMDIxNWMwNGVhMGM4NjVmMjc4ZTA4MGNkMDU5Njc4NjVhMmE5MTA0YWUzNjUzIiwiY29udGV4dE5hbWUiOiJWZXJpZGEgVGVzdGluZzogQXV0aGVudGljYXRpb24iLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNjYxNDE5ODQ2LCJleHAiOjE2NjE0MTk5MDZ9.tHugqMHM_udE-eV0u2_2oCjzDSiljfK8DVieK-GcXcU'
            authContext.refreshToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImVIUTlLTFprbE9UVERjaU1TOXFOY1Nzb0hBUUJSbUxDbEQ3d2pDUnBsSXNSUE45emZMdHBSM0JlM3d0cXRVVHlFakVPcVhpS2NZeG5zZHBWWTlWRWE3TmUwNUtsUElPUTQxSlpJQktHWW1NYjE2ajRkWkZxVThlek1VZFR1SnRFYmNKUlY0M09JWXE4OTF0ZXY0TDhKY2xPdzBZV1BweTFoMmpKTHkzblNJNVZsZ3RaVG1HVmI5cXlDODRrVnd1NGsySzVvN1VuOFkyUmNWbGpEa2lZRXpaanBxbzlkc0l4Mkh0UGNQcE9TVDhVM05WU29TWjFibzNBdU5CRjkxbE4iLCJkaWQiOiJkaWQ6dmRhOjB4ZTcwZTYyODQyNzg4MGFiMDFiZTU1YTM0OWYxY2VmMDQ3OWIyMWJmOCIsInN1YiI6InZmNWYxOWYyYzcyYTFmNDllYjcwMDIxNWMwNGVhMGM4NjVmMjc4ZTA4MGNkMDU5Njc4NjVhMmE5MTA0YWUzNjUzIiwiY29udGV4dE5hbWUiOiJWZXJpZGEgVGVzdGluZzogQXV0aGVudGljYXRpb24iLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNjYxNDE5ODQ2LCJleHAiOjE2NjE0MTk5MDZ9.tHugqMHM_udE-eV0u2_2oCjzDSiljfK8DVieK-GcXcU'
            
            // 2/ initialise a new testing account that has a single context with an invalid access and refresh token
            const account2 = new AuthContextAccount({
                    privateKey: CONFIG.VDA_PRIVATE_KEY,
                    didClientConfig: CONFIG.DID_CLIENT_CONFIG,
                    environment: CONFIG.ENVIRONMENT
                },
                VALID_CONTEXT,
                authContext
            )

            // 3/ initiate a new context using the context auth
            await network2.connect(account2)
            const context2 = await network2.openContext(VALID_CONTEXT)

            // 4/ Create a new context which should re-authenticate the refresh token
            const db2 = await context2?.openDatabase(DB_NAME_OWNER, {
                saveDatabase: false
            })

            assert.ok(db2, 'Have successfully opened a database')

            const rows = await db2!.getMany()
            assert.ok(rows && rows.length, 'Have valid results returned')
        })

        // @todo: test with public database, not encrypted database
        
    })
})