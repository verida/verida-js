'use strict'
const assert = require('assert')

import VeridaClient from '../../src/index'
import { Utils } from '@verida/3id-utils-node'
import { AutoAccount } from '@verida/account'
import CONFIG from '../config'
import { StorageLink } from '@verida/storage-link'
StorageLink.setSchemaId(CONFIG.STORAGE_LINK_SCHEMA)

const DS_CONTACTS = 'https://schemas.verida.io/social/contact/schema.json'

const MESSAGE_DATA = {
    data: [
    {
        name: 'Vitalik Buterin',
        firstName: 'Vitalik',
        lastName: 'Buterin',
        email: 'me@vitalik.eth',
        schema: DS_CONTACTS
    }]
}

const CONTEXT_1 = "Verida Testing: Test App 1"
const CONTEXT_2 = "Verida Testing: Test App 2"

/**
 * 
 */
describe('Messaging tests', () => {
    // Instantiate utils
    const utils = new Utils(CONFIG.CERAMIC_URL)
    let ceramic1, context1
    let ceramic2, context2

    const client1 = new VeridaClient({
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

    const client2 = new VeridaClient({
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

    describe('Sending messages', function() {
        this.timeout(100000)
        
        it('can send a message', async function() {
            ceramic1 = await utils.createAccount('ethr', CONFIG.ETH_PRIVATE_KEY)
            const account = new AutoAccount(ceramic1)
            await client1.connect(account)
            context1 = await client1.openContext(CONFIG.CONTEXT_NAME, true)
            const messaging = await context1.getMessaging()
            
            const result = await messaging.send(CONFIG.DID_2, 'inbox/type/dataSend', MESSAGE_DATA, 'Test message', {
                recipientContextName: CONTEXT_1
            })

            console.log(result)
            assert.ok(result && result.id, "Message send returned a valid result object")
            
            /*const datastore = await context.openDatastore(DS_CONTACTS)

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
            assert.ok(row.firstName == contact.firstName, 'Data matches')*/
        })

        it('can receive a message', async function() {
            ceramic2 = await utils.createAccount('ethr', CONFIG.ETH_PRIVATE_KEY_2)
            const account = new AutoAccount(ceramic2)
            await client2.connect(account)
            context2 = await client2.openContext(CONFIG.CONTEXT_NAME, true)
            const messaging = await context2.getMessaging()

            const messages = await messaging.getMessages()
            console.log(messages)
            assert.oko(messages.length, "At least one message exists")
        })
    })

})

// send messages between two different users
// send messages between the same user and different applications