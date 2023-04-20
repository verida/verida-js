'use strict'
const assert = require('assert')

import { Client } from '../../src/index'
import { AutoAccount } from '@verida/account-node'
import CONFIG from '../config'
import { assertIsValidDbResponse, assertIsValidSignature } from '../utils'

const DB_NAME_OWNER = 'OwnerTestDb_1'
const DB_NAME_USER = 'UserTestDb_1'
const DB_NAME_USER_2 = 'UserTestDb_2'
const DB_NAME_USER_3 = 'UserTestDb_3'
const DB_NAME_PUBLIC = 'PublicTestDb_1'
const DB_NAME_PUBLIC_WRITE = 'PublicWriteTestDb_1'
const DB_NAME_USER_WRITE_PUBLIC_READ = 'UserWritePublicReadTestDb_1'

/**
 * 
 */
describe('Verida database tests', () => {
    let context, did1
    let context2, did2
    let context3, did3
    let DB_USER_ENCRYPTION_KEY

    const network = new Client({
        environment: CONFIG.ENVIRONMENT,
        didClientConfig: {
            rpcUrl: CONFIG.DID_CLIENT_CONFIG.rpcUrl
        }
    })

    const network2 = new Client({
        environment: CONFIG.ENVIRONMENT,
        didClientConfig: {
            rpcUrl: CONFIG.DID_CLIENT_CONFIG.rpcUrl
        }
    })

    const network3 = new Client({
        environment: CONFIG.ENVIRONMENT,
        didClientConfig: {
            rpcUrl: CONFIG.DID_CLIENT_CONFIG.rpcUrl
        }
    })

    describe('Manage databases for the authenticated user', function() {
        this.timeout(200000)
        
        it('can open a database with owner/owner permissions', async function() {
            // Initialize account 1
            const account1 = new AutoAccount({
                privateKey: CONFIG.VDA_PRIVATE_KEY,
                environment: CONFIG.ENVIRONMENT,
                didClientConfig: CONFIG.DID_CLIENT_CONFIG
            })
            did1 = await account1.did()
            await network.connect(account1)
            context = await network.openContext(CONFIG.CONTEXT_NAME, true)

            // Initialize account 2
            const account2 = new AutoAccount({
                privateKey: CONFIG.VDA_PRIVATE_KEY_2,
                environment: CONFIG.ENVIRONMENT,
                didClientConfig: CONFIG.DID_CLIENT_CONFIG
            })
            did2 = await account2.did()
            await network2.connect(account2)
            context2 = await network2.openContext(CONFIG.CONTEXT_NAME, true)

            // Initialize account 3
            const account3 = new AutoAccount({
                privateKey: CONFIG.VDA_PRIVATE_KEY_3,
                environment: CONFIG.ENVIRONMENT,
                didClientConfig: CONFIG.DID_CLIENT_CONFIG
            })
            did3 = await account3.did()
            await network3.connect(account3)
            context3 = await network3.openContext(CONFIG.CONTEXT_NAME, true)

            const database = await context.openDatabase(DB_NAME_OWNER)

            await database.save({'hello': 'world'})
            const data = await database.getMany()

            assertIsValidDbResponse(assert, data)

            assert.ok(data[0].hello == 'world', 'First result has expected value')
            await database.close({
                clearLocal: true
            })
        })

        it('can open an existing database with user permissions', async function() {
            const database = await context.openDatabase(DB_NAME_USER, {
                permissions: {
                    read: 'users',
                    write: 'users'
                }
            })
            const info = await database.info()
            DB_USER_ENCRYPTION_KEY = info.encryptionKey

            // Grant read / write access to DID_3 for future tests relating to read / write of user databases
            await database.updateUsers([did3], [did3])

            const result = await database.save({'hello': 'world'})
            const data = await database.get(result.id)

            assert.ok(data.hello == 'world', 'First result has expected value')

            // setup an extra database with a row for testing read=public, write=users
            const database2 = await context.openDatabase(DB_NAME_USER_WRITE_PUBLIC_READ, {
                permissions: {
                    read: 'public',
                    write: 'users'
                }
            })

            await database2.save({'hello': 'world'})

            await database.close({
                clearLocal: true
            })
            await database2.close({
                clearLocal: true
            })
        })

        it('can create a new database defining initial users', async function() {
            const database = await context.openDatabase(DB_NAME_USER_2, {
                permissions: {
                    read: 'users',
                    readList: [did1, did3],
                    write: 'users',
                    writeList: [did1, did3]
                }
            })
            const info = await database.info()

            const result = await database.save({'hello': 'world'})
            const data = await database.get(result.id)

            assert.ok(data.hello == 'world', 'First result has expected value')

            await database.close({
                clearLocal: true
            })

            // open the previously created database as an external user
            const database3 = await context3.openExternalDatabase(DB_NAME_USER_2, did1, {
                permissions: {
                    read: 'users',
                    readList: [did1, did3],
                    write: 'users',
                    writeList: [did1, did3]
                },
                encryptionKey: info.encryptionKey
            })

            const results = await database3.getMany()
            assert.ok(results.length, 'Results returned')

            await database3.close({
                clearLocal: true
            })
        })

        it('can open a database with public read permissions', async function() {
            const database = await context.openDatabase(DB_NAME_PUBLIC, {
                permissions: {
                    read: 'public',
                    write: 'owner'
                }
            })

            const saveResult = await database.save({'hello': 'world'})
            assert.ok(saveResult, 'Have a valid save result')
            const data = await database.get(saveResult.id)
            assert.ok(data && data.hello == 'world', 'First result has expected value')

            await database.close({
                clearLocal: true
            })
        })

        it('can open a database with public write permissions', async function() {
            const database = await context.openDatabase(DB_NAME_PUBLIC_WRITE, {
                permissions: {
                    read: 'public',
                    write: 'public'
                }
            })

            const saveResult = await database.save({'hellopublic': 'world'})
            assert.ok(saveResult, 'Have a valid save result')
            const data = await database.get(saveResult.id)
            assert.ok(data && data.hellopublic == 'world', 'First result has expected value')

            await database.close({
                clearLocal: true
            })
        })
    })

    describe('Access public databases', function() {
        this.timeout(100*1000)
        
        // We initialize a second account and have it attempt to access the
        // databases created earlier in this set of tests (see above)
        it('can read from an external database with public read', async function() {
            const database = await context2.openExternalDatabase(DB_NAME_PUBLIC, did1, {
                permissions: {
                    read: 'public',
                    write: 'owner'
                }
            })

            assert.ok(database && database.constructor.name == 'PublicDatabase', 'Valid database instance returned')
            const data = await database.getMany()

            assertIsValidDbResponse(assert, data)
            assert.ok(data[0].hello == 'world', 'First result has expected value')

            await database.close({
                clearLocal: true
            })
        })

        it(`can't write to an external database with public read, but owner write`, async function() {
            const database = await context2.openExternalDatabase(DB_NAME_PUBLIC, did1, {
                permissions: {
                    read: 'public',
                    write: 'owner'
                }
            })

            const promise = new Promise((resolve, rejects) => {
                database.save({'cant': 'write'}).then(rejects, resolve)
            })
            const result = await promise

            assert.deepEqual(result, new Error('Unable to save. Database is read only.'))

            await database.close({
                clearLocal: true
            })
        })

        it(`can write to an external database with public read and public write`, async function() {
            const database = await context2.openExternalDatabase(DB_NAME_PUBLIC_WRITE, did1, {
                permissions: {
                    read: 'public',
                    write: 'public'
                }
            })

            const result = await database.save({'write': 'from external DID'})
            assert.ok(result.id, 'Created a record with a valid ID')
            
            const data = await database.get(result.id)
            assert.ok(data, 'Fetched saved record')
            assert.ok(data.write == 'from external DID', 'Result has expected value')

            await database.close({
                clearLocal: true
            })
        })

        it(`data saved to external database has valid signature`, async function() {
            const database = await context2.openExternalDatabase(DB_NAME_PUBLIC_WRITE, did1, {
                permissions: {
                    read: 'public',
                    write: 'public'
                }
            })

            const result = await database.save({'write-signed': 'signed data'})
            assert.ok(result.id, 'Created a record with a valid ID')
            
            const data = await database.get(result.id)
            assert.ok(data, 'Fetched saved record')
            assert.ok(Object.keys(data.signatures).length, 'Data has signatures')
            await assertIsValidSignature(assert, network2, did2, data)

            await database.close({
                clearLocal: true
            })
        })

        it(`can't open an external database with owner read and not the owner`, async function() {
            const promise = new Promise((resolve, rejects) => {
                context2.openExternalDatabase(DB_NAME_OWNER, did1, {
                    permissions: {
                        read: 'owner',
                        write: 'owner'
                    }
                }).then(rejects, resolve)
            })
            const result = await promise

            assert.deepEqual(result, new Error('Unable to open database. Permissions require "owner" access to read, but account is not owner.'))
        })

        it(`can't write to an external database with write=users and read=public, where user has no access`, async function() {
            const database = await context2.openExternalDatabase(DB_NAME_USER_WRITE_PUBLIC_READ, did1, {
                permissions: {
                    read: 'public',
                    write: 'users'
                }
            })

            const promise = new Promise((resolve, rejects) => {
                database.save({'write-user': 'doesnt work'}).then(rejects, resolve)
            })
            const result = await promise

            assert.deepEqual(result, new Error('Unable to save. Database is read only.'))
            await database.close({
                clearLocal: true
            })
        })
    })

    describe('Access user databases', function() {
        this.timeout(100*1000)
          const ENCRYPTION_KEY_WRONG = new Uint8Array([
            132,  71,  15,  38, 114, 251,  22, 144,
            177,  41, 104, 145,  58, 187,  22, 244,
            161,  78,  65,  16,  51, 185,  11,  18,
              6, 246, 237,  80,  12, 100, 211, 149
          ])

        it(`can read and write from an external database with read=users where current user CAN read`, async function() {
            const database = await context3.openExternalDatabase(DB_NAME_USER, did1, {
                permissions: {
                    read: 'users',
                    write: 'users'
                },
                encryptionKey: DB_USER_ENCRYPTION_KEY
            })

            const result = await database.save({'write': 'from valid external user DID'})
            assert.ok(result.id, 'Created a record with a valid ID')
            
            const data = await database.get(result.id)
            assert.ok(data, 'Fetched saved record')
            assert.ok(data.write == 'from valid external user DID', 'Result has expected value')

            await database.close({
                clearLocal: true
            })
        })

        it(`can't read from an external database with read=user where current user CANT read`, async function() {
            const promise = new Promise((resolve, rejects) => {
                context2.openExternalDatabase(DB_NAME_USER, did1, {
                    permissions: {
                        read: 'users',
                        write: 'users'
                    },
                    encryptionKey: DB_USER_ENCRYPTION_KEY
                }).then(rejects, resolve)
            })

            const result: any = await promise
            assert.ok(result.message.match('Unable to open database'))
        })

        it(`can't write an external database with write=users and user no access`, async function() {
            const promise = new Promise((resolve, rejects) => {
                context2.openExternalDatabase(DB_NAME_USER, did1, {
                    permissions: {
                        read: 'users',
                        write: 'users'
                    },
                    encryptionKey: DB_USER_ENCRYPTION_KEY
                }).then(rejects, resolve)
            })

            const result: any = await promise
            assert.ok(result.message.match('Unable to open database'))
        })

        it(`can't open an external users database without an encryption key`, async function() {
            const promise = new Promise((resolve, rejects) => {
                context3.openExternalDatabase(DB_NAME_USER, did1, {
                    permissions: {
                        read: 'users',
                        write: 'users'
                    }
                }).then(rejects, resolve)
            })

            const result: any = await promise
            assert.ok(result.message.match('Unable to open external database'))
        })

        // this one is breaking things
        it(`can't open an external users database with the wrong encryption key`, async function() {
            const promise = new Promise((resolve, rejects) => {
                context3.openExternalDatabase(DB_NAME_USER, did1, {
                    permissions: {
                        read: 'users',
                        write: 'users'
                    },
                    encryptionKey: ENCRYPTION_KEY_WRONG
                }).then(rejects, resolve)
            })

            const result: any = await promise
            assert.ok(result.message.match('Invalid encryption key supplied'))
        })

        // @todo: For some reason this test causes an issue where the test never fully completes
        // despite all attempts to close databases and contexts
        it(`can't write an external database where a did has read access, but not write access`, async () => {
            try {
                const ownerDatabase = await context.openDatabase(DB_NAME_USER_3, {
                    permissions: {
                        read: 'users',
                        readList: [did1, did2],
                        write: 'owner'
                    }
                })
                const info = await ownerDatabase.info()
                const encryptionKey = info.encryptionKey

                await ownerDatabase.close({
                    clearLocal: true
                })

                const did2Database = await context2.openExternalDatabase(DB_NAME_USER_3, did1, {
                    permissions: {
                        read: 'users',
                        readList: [did1, did2],
                        write: 'owner'
                    },
                    encryptionKey: encryptionKey
                })

                const promise = new Promise((resolve, rejects) => {
                    did2Database.save({'write': 'from valid external user DID'}).then(rejects, resolve)
                })

                const result = await promise
                assert.deepEqual(result, new Error('Unable to save. Database is read only.'))

                await did2Database.close({
                    clearLocal: true
                })
            } catch (err) {
                console.log(err.message)
            }
        })

        after(async () => {
            await context.close({
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
})