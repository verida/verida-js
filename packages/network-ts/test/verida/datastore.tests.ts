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
    })

})