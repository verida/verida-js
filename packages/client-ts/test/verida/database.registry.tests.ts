'use strict'
const assert = require('assert')

import { Client } from '../../src/index'
import { AutoAccount } from '@verida/account-node'
import { StorageLink } from '@verida/storage-link'
import CONFIG from '../config'
StorageLink.setSchemaId(CONFIG.STORAGE_LINK_SCHEMA)

const DB_NAME_1 = 'Db_Registry_Test_1'
const DB_NAME_2 = 'Db_Registry_Test_2'

/**
 * 
 */
describe('Verida database registry tests', () => {
    let context, did1

    const network = new Client({
        ceramicUrl: CONFIG.CERAMIC_URL
    })

    describe('Manage databases for the authenticated user', function() {
        this.timeout(200000)
        
        it('can open owner/owner database with valid registry entry', async function() {
            // Initialize account 1
            const account1 = new AutoAccount(CONFIG.DEFAULT_ENDPOINTS, {
                chain: 'ethr',
                privateKey: CONFIG.ETH_PRIVATE_KEY,
                ceramicUrl: CONFIG.CERAMIC_URL
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

            const dbRegistry = await context.getDbRegistry()
            const dbRegistryDatabase = await dbRegistry.get(DB_NAME_2, did1, CONFIG.CONTEXT_NAME)
            assert.ok(dbRegistryDatabase == undefined, 'Database registry entry not created')
        })

        

        
    })

})