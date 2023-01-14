'use strict'
const assert = require('assert')

import { Client } from '../../src/index'
import { AutoAccount } from '@verida/account-node'
import CONFIG from '../config'

const DB_NAME_1 = 'DbRegistry_1'
const DB_NAME_2 = 'DbRegistry_2'
const DB_NAME_3 = 'DbRegistry_3'
const DB_NAME_4 = 'DbRegistry_4'

/**
 * 
 */
describe('Verida database registry tests', () => {
    let context, did1

    const network = new Client({
        environment: CONFIG.ENVIRONMENT,
        didClientConfig: {
            rpcUrl: CONFIG.DID_CLIENT_CONFIG.rpcUrl
        }
    })

    describe('Manage databases for the authenticated user', function() {
        this.timeout(200000)
        
        it('can open owner/owner database with valid registry entry', async function() {
            // Initialize account 1
            const account1 = new AutoAccount(CONFIG.DEFAULT_ENDPOINTS, {
                privateKey: CONFIG.VDA_PRIVATE_KEY,
                environment: CONFIG.ENVIRONMENT,
                didClientConfig: CONFIG.DID_CLIENT_CONFIG
            })
            did1 = await account1.did()
            await network.connect(account1)
            context = await network.openContext(CONFIG.CONTEXT_NAME, true)
            const database = await context.openDatabase(DB_NAME_1)
            await database.save({hello: 'world'})
            const dbRegistry = await context.getDbRegistry()
            const dbRegistryDatabases = await dbRegistry.getMany()

            assert.ok(dbRegistryDatabases.length, 'At least one database registry entry returned')

            const dbRegistryDatabase = await dbRegistry.get(DB_NAME_1, did1, CONFIG.CONTEXT_NAME)
            assert.ok(dbRegistryDatabase, 'Expected database entry created')

            const dbInfo = await database.info()
            assert.equal(dbRegistryDatabase.dbHash, dbInfo.databaseHash,'Expected database hash')
            assert.equal(dbRegistryDatabase.dbName, dbInfo.databaseName,'Expected database name')
        })

        it('can open owner/owner database and not save a registry entry', async () => {
            const database = await context.openDatabase(DB_NAME_2, {
                saveDatabase: false
            })
            await database.save({hello: 'world'})

            const dbRegistry = await context.getDbRegistry()
            const dbRegistryDatabase = await dbRegistry.get(DB_NAME_2, did1, CONFIG.CONTEXT_NAME)
            assert.ok(dbRegistryDatabase == undefined, 'Database registry entry not created')
        })

        it('can update permissions of existing registry entry', async () => {
            const testDid = 'did:3:kjzl6cwe1jw146zw5cf7n9fvcbhb83hk4kv1vmdf94b57m8f67oidyaj17l3ujm'

            const database = await context.openDatabase(DB_NAME_3, {
                permissions: {
                    read: 'users',
                    write: 'users'
                }
            })

            await database.save({hello: 'world'})
            const dbRegistry = await context.getDbRegistry()

            const dbRegistryDatabase1 = await dbRegistry.get(DB_NAME_3, did1, CONFIG.CONTEXT_NAME)
            assert.ok(dbRegistryDatabase1, 'Database registry entry exists')

            // change permissions on the database
            await database.updateUsers([testDid], [testDid])
            const dbRegistryDatabase2 = await dbRegistry.get(DB_NAME_3, did1, CONFIG.CONTEXT_NAME)

            const expectedPermissions = {
                read: 'users',
                readList: [testDid],
                write: 'users',
                writeList: [testDid]
            }

            assert.deepEqual(dbRegistryDatabase2.permissions, expectedPermissions, 'Database registry entry updated')
        })

        it('can open public database with valid registry entry', async function() {
            const database = await context.openDatabase(DB_NAME_4, {
                permissions: {
                    read: 'public',
                    write: 'public'
                }
            })
            await database.save({hello: 'world'})
            const dbRegistry = await context.getDbRegistry()

            const dbRegistryDatabase = await dbRegistry.get(DB_NAME_4, did1, CONFIG.CONTEXT_NAME)
            assert.ok(dbRegistryDatabase, 'Expected database entry created')

            const dbInfo = await database.info()

            assert.equal(dbRegistryDatabase.dbHash, dbInfo.databaseHash,'Expected database hash')
            assert.equal(dbRegistryDatabase.dbName, dbInfo.databaseName,'Expected database name')
        })
    })

    after(async () => {
        await context.close({
            clearLocal: true
        })
    })
})