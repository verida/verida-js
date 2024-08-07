'use strict'
const assert = require('assert')

import { Client, Context } from '../../src/index'
import { AutoAccount } from '@verida/account-node'
import CONFIG from '../config'
import { StorageLink } from '@verida/storage-link'
import _ from 'lodash'
import { Wallet } from 'ethers'
import { AccountConfig, SecureContextEndpointType } from '@verida/types'

const wallet = Wallet.createRandom()
const address = wallet.address.toLowerCase()
const did = `did:vda:testnet:${address}`

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

const CONTEXT_1 = "Verida Testing: Notification Tests __1"
const ENDPOINT_CONFIG: AccountConfig = _.merge({}, CONFIG.DEFAULT_ENDPOINTS, {
    defaultNotificationServer: {
        type: 'VeridaNotification',
        endpointUri: ['http://localhost:5011/']
    }
})

/**
 * Helper function
 * 
 * Fetch the storage link configuration and confirm there is a notification entry
 * @param account 
 * @param context 
 * @param did 
 */
const validateDidDocument = async(account: AutoAccount, context: Context, did: string) => {
    const didClient = await account.getDidClient()
    const fetchedStorageConfig = await StorageLink.getLink(didClient, did, context.getContextName())

    assert.ok(fetchedStorageConfig, 'Have sotrage config for context')
    assert.ok(fetchedStorageConfig!.services.notificationServer, 'Have a notification server in the DID document')
    assert.equal(fetchedStorageConfig!.services.notificationServer.type, ENDPOINT_CONFIG.defaultNotificationServer!.type, 'Have correct notification server type')

    assert.deepEqual([fetchedStorageConfig!.services.notificationServer.endpointUri], [ENDPOINT_CONFIG.defaultNotificationServer!.endpointUri], 'Have correct notification server endpointUri')
}

/**
 * 
 */
describe('Verida notification tests', () => {
    let context, context2, context3
    const client = new Client({
        network: CONFIG.NETWORK,
        didClientConfig: {
            rpcUrl: CONFIG.DID_CLIENT_CONFIG.rpcUrl
        }
    })

    const client2 = new Client({
        network: CONFIG.NETWORK,
        didClientConfig: {
            rpcUrl: CONFIG.DID_CLIENT_CONFIG.rpcUrl
        }
    })

    const client3 = new Client({
        network: CONFIG.NETWORK,
        didClientConfig: {
            rpcUrl: CONFIG.DID_CLIENT_CONFIG.rpcUrl
        }
    })

    let VDA_DID, VDA_ACCOUNT

    describe.skip('Sending messages', function() {
        this.timeout(200 * 1000)

        it('can specify a notification server when creating a new account context', async () => {
            // Initialize account 1
            const account = new AutoAccount({
                privateKey: wallet.privateKey,
                network: CONFIG.NETWORK,
                didClientConfig: CONFIG.DID_CLIENT_CONFIG
            }, ENDPOINT_CONFIG)
            const did = await account.did()
            VDA_DID = did
            await client.connect(account)
            context = await client.openContext(CONTEXT_1, true)

            const notificationService = await context!.getNotification()
            assert.ok(notificationService, 'Have a notification service instance')

            await validateDidDocument(account, context!, did)

            // Delete storage context
            const success = await account.unlinkStorage(CONTEXT_1)
            assert.equal(success, true, 'Unlinked storage context from account')
        })

        it('can force add a notification server to an existing account context', async () => {
            // Initialize account 1 without a notification server
            const account = new AutoAccount({
                privateKey: wallet.privateKey,
                network: CONFIG.NETWORK,
                didClientConfig: CONFIG.DID_CLIENT_CONFIG
            })
            VDA_ACCOUNT = account
            const did = await account.did()
            await client2.connect(account)
            context = await client2.openContext(CONTEXT_1, true)

            const accountStorageConfig = await context.getContextConfig()
            assert.ok(!accountStorageConfig.services.notificationServer, `Don't have notification service endpoint in DID document`)

            const notificationService = await context.getNotification()
            assert.ok(!notificationService, `Don't have notification service instance`)

            // Add a notification server
            const success1 = await account.linkStorageContextService(CONTEXT_1, SecureContextEndpointType.NOTIFICATION, 'VeridaNotification', <string[]> ENDPOINT_CONFIG.defaultNotificationServer!.endpointUri)
            assert.ok(success1, `Link storage context service returned success`)

            // Use a new client (the old context config is cached in the existing client)
            await client3.connect(account)
            context2 = await client3.openContext(CONTEXT_1, false)

            const notificationService2 = await context2.getNotification()
            assert.ok(notificationService2, 'Have a notification service instance')

            await validateDidDocument(account, context2, did)
        })

        it('can ping a notification server when sending a message', async () => {
            const account = new AutoAccount({
                privateKey: wallet.privateKey,
                network: CONFIG.NETWORK,
                didClientConfig: CONFIG.DID_CLIENT_CONFIG
            }, ENDPOINT_CONFIG);
            const did = await account.did()
            context = await client3.openContext(CONTEXT_1, false)
            let messaging = await context.getMessaging()
            
            await validateDidDocument(VDA_ACCOUNT, context, VDA_DID)

            const result = await messaging.send(VDA_DID, 'inbox/type/dataSend', MESSAGE_DATA, 'Test message', {
                recipientContextName: CONTEXT_1,
                did: did
            })

            assert.ok(result && result.ok, 'Received a valid message response')

            const notificationService = await context.getNotification()
            assert.ok(notificationService, 'Have a notification service')
            
            const errors = notificationService.getErrors()
            messaging = null
            // Note: If you aren't running a notification service, this will always fail
            // As such, this is commented out
            //assert.ok(errors.length == 0, 'No ping errors')
        })

        after(async () => {
            await context.close({
                clearLocal: true
            })
            await context2.close({
                clearLocal: true
            })
        })
    })

})
