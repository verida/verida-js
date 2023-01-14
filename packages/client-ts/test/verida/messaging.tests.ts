'use strict'
const assert = require('assert')

import { Client } from '../../src/index'
import { LimitedAccount } from '@verida/account-node'
import CONFIG from '../config'
import { sleep } from '../utils'

const DS_CONTACTS = 'https://common.schemas.verida.io/social/contact/latest/schema.json'

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

const CONTEXT_1 = "Verida Tests: Messaging Application 1"
const CONTEXT_2 = "Verida Tests: Messaging Application 2"

/**
 * 
 */
describe('Verida messaging tests', () => {
    let context1, did1
    let context2, did2
    let context3, did3
    let newContext

    const client1 = new Client({
        environment: CONFIG.ENVIRONMENT,
        didClientConfig: {
            rpcUrl: CONFIG.DID_CLIENT_CONFIG.rpcUrl
        }
    })

    const client2 = new Client({
        environment: CONFIG.ENVIRONMENT,
        didClientConfig: {
            rpcUrl: CONFIG.DID_CLIENT_CONFIG.rpcUrl
        }
    })

    const client3 = new Client({
        environment: CONFIG.ENVIRONMENT,
        didClientConfig: {
            rpcUrl: CONFIG.DID_CLIENT_CONFIG.rpcUrl
        }
    })

    describe.skip('Sending messages', function() {
        this.timeout(20 * 1000)

        it('can send a message between users of the same application', async function() {
            // Initialize account 1
            const account1 = new LimitedAccount(CONFIG.DEFAULT_ENDPOINTS, {
                privateKey: CONFIG.VDA_PRIVATE_KEY,
                environment: CONFIG.ENVIRONMENT,
                didClientConfig: CONFIG.DID_CLIENT_CONFIG
            }, [CONTEXT_1])
            did1 = await account1.did()
            await client1.connect(account1)
            context1 = await client1.openContext(CONTEXT_1, true)

            // Initialize account 2 (different private key, same application context)
            const account2 = new LimitedAccount(CONFIG.DEFAULT_ENDPOINTS, {
                privateKey: CONFIG.VDA_PRIVATE_KEY_2,
                environment: CONFIG.ENVIRONMENT,
                didClientConfig: CONFIG.DID_CLIENT_CONFIG
            }, [CONTEXT_1])
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

            // Give replication time to complete
            await sleep(5000)

            // manually force processing all inbox items
            await inbox.processAll()

            const messages2 = await messaging2.getMessages()
            assert.ok(result && result.id, "Message send returned a valid result object")
            assert.ok(messages2.length, "At least one message exists for the recipient")
            
        })

        // @todo: work out why this test always hangs -- issue with messaging?
        it('can receive a message from a user of the same application', async function() {
            // Create a new context so we don't reuse the same `inbox` instance
            newContext = await client2.openContext(CONTEXT_1, false)
            let messaging = await newContext.getMessaging()
            await messaging.init()
            const messages = await messaging.getMessages()

            assert.ok(messages.length, "At least one message exists")
            messaging = null
        })

        // @todo: Make this work again
        it.skip('can trigger an event on a new message', function(done) {
            let messaging2
            let isDone = false

            const callback1 = function(info) {
                if (isDone) return
                done()
                isDone = true
            }

            // Configure an event listener that will call done() to complete this test
            const init = async () => {
                messaging2 = await context2.getMessaging()
                const event = messaging2.onMessage(callback1)
            }

            // Send a new inbox message to trigger the event
            const finish = async () => {
                const messaging1 = await context1.getMessaging()
                const result = await messaging1.send(did2, 'inbox/type/dataSend', MESSAGE_DATA, 'Test message 2', {
                    recipientContextName: CONTEXT_1
                })

                const messages = await messaging2.getMessages()
            }

            const promise = new Promise((resolve, rejects) => {
                init().then(() => {
                    finish().then(rejects, resolve)
                })
            })
        })

        it('can send a message between two different users of different applications', async function() {
            // Initialize account 3 (different private key, different application context)
            const account3 = new LimitedAccount(CONFIG.DEFAULT_ENDPOINTS, {
                privateKey: CONFIG.VDA_PRIVATE_KEY_2,
                environment: CONFIG.ENVIRONMENT,
                didClientConfig: CONFIG.DID_CLIENT_CONFIG
            }, [CONTEXT_2])
            did3 = await account3.did()
            await client3.connect(account3)
            context3 = await client3.openContext(CONTEXT_2, true)

            // Initialize messaging for both accounts
            const messaging1 = await context1.getMessaging()
            await messaging1.init()
            const messaging2 = await context3.getMessaging()
            await messaging2.init()

            // Delete any existing inbox messages for the recipient
            const inbox = await messaging2.getInbox()
            const inboxDs = await inbox.getInboxDatastore()
            await inboxDs.deleteAll()

            // Send a message from DID1 to DID2
            const result = await messaging1.send(did2, 'inbox/type/dataSend', MESSAGE_DATA, 'Test message', {
                recipientContextName: CONTEXT_2
            })

            assert.ok(result && result.id, "Message send returned a valid result object")
        })

        it('can receive a message from a user of a different application', async function() {
            // Create a new context so we don't reuse the same `inbox` instance
            newContext = await client3.openContext(CONTEXT_2, true)
            const messaging = await newContext.getMessaging()
            await messaging.init()
            const messages = await messaging.getMessages()

            assert.ok(messages.length, "At least one message exists")
        })
    })

    after(async () => {
        try {
            // @todo: get this to work so tests don't hang. there may be an issue in messaging (test #2 always causes hang)
            await context1.close({
                clearLocal: true
            })
            await context2.close({
                clearLocal: true
            })
            await context3.close({
                clearLocal: true
            })
            await newContext.close({
                clearLocal: true
            })
        } catch (err) {}
    })

})

// attempt to send a message to a non-existent DID or non-existent application context for a DID produces an error (manually tested for now)
// send messages between the same user and different applications