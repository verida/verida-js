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
    let ceramic1, context1, did1
    let ceramic2, context2, did2

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
        
        it('can send a message between users of the same application', async function() {
            // Initialize account 1
            ceramic1 = await utils.createAccount('ethr', CONFIG.ETH_PRIVATE_KEY)
            const account1 = new AutoAccount(ceramic1)
            did1 = await account1.did()
            await client1.connect(account1)
            context1 = await client1.openContext(CONTEXT_1, true)

            // Initialize account 2
            ceramic2 = await utils.createAccount('ethr', CONFIG.ETH_PRIVATE_KEY_2)
            const account2 = new AutoAccount(ceramic2)
            did2 = await account2.did()
            await client2.connect(account2)
            context2 = await client2.openContext(CONTEXT_1, true)

            // Initialize messaging for both accounts
            const messaging1 = await context1.getMessaging()
            await messaging1.init()
            const messaging2 = await context2.getMessaging()
            await messaging2.init()

            // Delete any existing inbox messages for the recipient
            const inbox = await messaging2.getInbox()
            const inboxDs = await inbox.getInboxDatastore()
            await inboxDs.deleteAll()

            // Send a message from DID1 to DID2
            const result = await messaging1.send(did2, 'inbox/type/dataSend', MESSAGE_DATA, 'Test message', {
                recipientContextName: CONTEXT_1
            })

            assert.ok(result && result.id, "Message send returned a valid result object")
        })

        it('can receive a message', async function() {
            const messaging = await context2.getMessaging()
            const messages = await messaging.getMessages()

            assert.ok(messages.length, "At least one message exists")
        })
    })

})

// attempt to send a message to a non-existent DID or non-existent application context for a DID produces an error
// verify changes event works for new inbox messages
// send messages between two different users of different applications
// send messages between the same user and different applications