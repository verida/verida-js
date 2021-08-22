'use strict'
const assert = require('assert')

import VeridaNetwork from '../../src/index'
import { Utils } from '@verida/3id-utils-node'
import { AutoAccount } from '@verida/account'
import { StorageLink } from '@verida/storage-link'
import CONFIG from '../config'
StorageLink.setSchemaId(CONFIG.STORAGE_LINK_SCHEMA)
import { assertIsValidDbResponse, assertIsValidSignature } from '../utils'

const DS_CONTACTS = 'https://schemas.verida.io/social/contact/schema.json'

/**
 * 
 */
describe('Datastore tests', () => {
    // Instantiate utils
    const utils = new Utils(CONFIG.CERAMIC_URL)
    let ceramic, context

    const network = new VeridaNetwork({
        defaultDatabaseServer: {
            type: 'VeridaDatabase',
            endpointUri: 'http://localhost:5000/'
        },
        defaultMessageServer: {
            type: 'VeridaMessage',
            endpointUri: 'http://localhost:5000/'
        },
        ceramicUrl: CONFIG.CERAMIC_URL
    })

    describe('Manage datastores for the authenticated user', function() {
        this.timeout(100000)
        
        it('can open a datastore with owner/owner permissions', async function() {
            ceramic = await utils.createAccount('ethr', CONFIG.ETH_PRIVATE_KEY)
            const account = new AutoAccount(ceramic)
            await network.connect(account)
            context = await network.openContext(CONFIG.CONTEXT_NAME, true)
            const datastore = await context.openDatastore(DS_CONTACTS)

            const result1 = await datastore.save({'hello': 'world'})
            assert.ok(result1 === false, 'Unable to save due to validation error')

            const contact = {
                firstName: 'John',
                lastName: 'Smith',
                email: 'john__smith.com'
            }

            const result2 = await datastore.save(contact)
            assert.ok(result2, 'Able to save valid data')

            const row = await datastore.get(result2.id)
            assert.ok(row, 'Able to fetch the inserted row')
            assert.ok(row.firstName == contact.firstName, 'Data matches')
        })

        it('can open a datastore with user permissions, as the owner', async function() {
            const datastore = await context.openDatastore(DS_CONTACTS, {
                permissions: {
                    read: 'users',
                    write: 'users'
                }
            })

            // Grant read / write access to DID_3 for future tests relating to read / write of user databases
            const updateResponse = await datastore.updateUsers([CONFIG.DID_3], [CONFIG.DID_3])

            const db = await datastore.getDb()
            const info = await db.info()

            const contact = {
                firstName: 'Jane',
                lastName: 'Doe',
                email: 'jane__doe.com'
            }

            const result = await datastore.save(contact)
            const data = await datastore.get(result.id)

            assert.ok(data.firstName == 'Jane', 'Row has expected value')
        })

        it('can open a datastore with user permissions, as an external user', async function() {
            const datastore = await context.openDatastore(DS_CONTACTS, {
                permissions: {
                    read: 'users',
                    write: 'users'
                }
            })

            // Grant read / write access to DID_3 for future tests relating to read / write of user databases
            const updateResponse = await datastore.updateUsers([CONFIG.DID_3], [CONFIG.DID_3])

            const db = await datastore.getDb()
            const info = await db.info()

            const contact = {
                firstName: 'Jane',
                lastName: 'Doe',
                email: 'jane__doe.com'
            }

            const result = await datastore.save(contact)
            const data = await datastore.get(result.id)

            assert.ok(data.firstName == 'Jane', 'Row has expected value')
        })
    })

    // open an external public datastore
    // open an external users datastore


    // @todo need a way to know the users that have access to a particular database

})