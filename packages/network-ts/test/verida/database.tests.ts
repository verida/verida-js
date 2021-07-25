'use strict'
const assert = require('assert')

import VeridaNetwork from '../../src/index'
import { Utils } from '@verida/3id-utils-node'
import { AutoAccount } from '@verida/account'
import { StorageLink } from '@verida/storage-link'
import CONFIG from '../config'
StorageLink.setSchemaId(CONFIG.STORAGE_LINK_SCHEMA)
import { assertIsValidDbResponse } from '../utils'

const DB_NAME_OWNER = 'OwnerTestDb'
const DB_NAME_USER = 'UserTestDb'
const DB_NAME_PUBLIC = 'PublicTestDb'

/**
 * 
 */
describe('Storage initialization tests', () => {
    // Instantiate utils
    const utils = new Utils(CONFIG.CERAMIC_URL)
    let ceramic, context
    let ceramic2, context2

    const network = new VeridaNetwork({
        defaultStorageServer: {
            type: 'VeridaStorage',
            endpointUri: 'http://localhost:5000/'
        },
        defaultMessageServer: {
            type: 'VeridaStorage',
            endpointUri: 'http://localhost:5000/'
        },
        ceramicUrl: CONFIG.CERAMIC_URL
    })

    const network2 = new VeridaNetwork({
        defaultStorageServer: {
            type: 'VeridaStorage',
            endpointUri: 'http://localhost:5000/'
        },
        defaultMessageServer: {
            type: 'VeridaStorage',
            endpointUri: 'http://localhost:5000/'
        },
        ceramicUrl: CONFIG.CERAMIC_URL
    })

    describe('Manage storage contexts for the authenticated user', function() {
        this.timeout(100000)
        
        it('can open a database with owner/owner permissions', async function() {
            ceramic = await utils.createAccount('ethr', CONFIG.ETH_PRIVATE_KEY)
            const account = new AutoAccount(ceramic)
            await network.connect(account)
            context = await network.openContext(CONFIG.CONTEXT_NAME, true)
            const database = await context.openDatabase(DB_NAME_OWNER)

            await database.save({'hello': 'world'})
            const data = await database.getMany()

            assertIsValidDbResponse(assert, data)
            assert.ok(data[0].hello == 'world', 'First result has expected value')
        })

        it('can open a database with user permissions', async function() {
            const database = await context.openDatabase(DB_NAME_USER, {
                permissions: {
                    read: 'users',
                    write: 'users'
                }
            })

            await database.save({'hello': 'world'})
            const data = await database.getMany()

            assertIsValidDbResponse(assert, data)
            assert.ok(data[0].hello == 'world', 'First result has expected value')
        })

        it('can open a database with public read permissions', async function() {
            const database = await context.openDatabase(DB_NAME_PUBLIC, {
                permissions: {
                    read: 'public',
                    write: 'owner'
                }
            })

            await database.save({'hello': 'world'})
            const data = await database.getMany()

            assertIsValidDbResponse(assert, data)
            assert.ok(data[0].hello == 'world', 'First result has expected value')
        })
    })

    describe('Access public storage contexts', function() {
        this.timeout(100000)

        /**
         * We initialize a second account and have it attempt to access the
         * databases created earlier in this set of tests (see above)
         */
        it('read from an external storage context with public read', async function() {
            ceramic2 = await utils.createAccount('ethr', CONFIG.ETH_PRIVATE_KEY_2)
            const account = new AutoAccount(ceramic2)
            await network2.connect(account)
            context2 = await network2.openContext(CONFIG.CONTEXT_NAME, true)

            const database = await context2.openExternalDatabase(DB_NAME_PUBLIC, CONFIG.DID, {
                permissions: {
                    read: 'public',
                    write: 'owner'
                }
            })

            assert.ok(database && database.constructor.name == 'PublicDatabase', 'Valid database instance returned')
            const data = await database.getMany()

            assertIsValidDbResponse(assert, data)
            assert.ok(data[0].hello == 'world', 'First result has expected value')
        })

        it(`can't write to an external storage context with public read, but owner write`, async function() {
            const database = await context2.openExternalDatabase(DB_NAME_PUBLIC, CONFIG.DID, {
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
        })

        // can write to an external storage context with public write
        // can't read from an external storage context with read=owner
        // can't read from an external storage context with read=users
        // can't write to an external storage context with write=owner
        // can't write to an external storage context with write=users
    })

    describe('Access user storage contexts', function() {
        this.timeout(100000)

        // open an external context
        // read from an external storage context with read=user where current user CAN read
        // can't read from an external storage context with read=user where current user CANT read

        // write to an external storage context with write=user where current user CAN write
        // can't write to an external storage context with write=user where current user CANT write

        // can't read from an external storage context with read=owner
        // can't write to an external storage context with write=owner

        // test providing the encryption key for an external storage
    })
})