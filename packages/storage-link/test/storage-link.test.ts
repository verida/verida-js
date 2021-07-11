'use strict'
const assert = require('assert')

import { StorageLink } from '../src/index'
import { Utils } from '@verida/3id-utils-node'
import { SecureStorageContextConfig } from '../src/interfaces'
import { IDX } from '@ceramicstudio/idx'

// Test Ethereum Private key used to create / unlock a 3ID
const ETH_PRIVATE_KEY = '0xc0da48347b4bcb2cfb08d6b8c26b52b47fd36ca6114974a0104d15fab076f553'
const CERAMIC_URL = 'http://localhost:7007' // Note: Requires running ceramic locally
const SECURE_CONTEXTS_SCHEMA_ID = 'kjzl6cwe1jw145rikixwqf0qf6d69982b72mtxbp96snvop9nsvlaf1avydww9f'

StorageLink.setSchemaId(SECURE_CONTEXTS_SCHEMA_ID)

// Test config
const testConfig: SecureStorageContextConfig = {
    id: 'Test App',
    publicKeys: {
        asymKey: {
            type: 'Curve25519EncryptionPublicKey',
            base58: '2oCCWT6ryrrDjTDbUFYJ4Q6RiN9n4ZMKeZCgf6qY81Dh'
        },
        signKey: {
            type: 'ED25519SignatureVerification',
            base58: 'HtJ9j1kWdohkGBhgrWjPTa8UkzEdfTJvF93eMzJJ9Za6'
        }
    },
    services: {
        storageServer: {
            type: 'VeridaStorage',
            endpointUri: 'https://storage.endpoint'
        },
        messageServer: {
            type: 'VeridaStorage',
            endpointUri: 'https://message.endpoint'
        }
    }
}
const TEST_APP_NAME2 = 'Test App 2'

describe('Storage Link', () => {
    // Instantiate utils
    const utils = new Utils(CERAMIC_URL)

    describe('Manage DID Links', async function() {
        this.timeout(20000)

        it('can link a DID to a secure storage context', async function() {
            const ceramic = await utils.createAccount('ethr', ETH_PRIVATE_KEY)
            let storageConfig = Object.assign({}, testConfig)
            await StorageLink.setLink(ceramic, ceramic.did.id, storageConfig)
            const links = await StorageLink.getLinks(ceramic, ceramic.did.id)

            const fetchedStorageConfig = await StorageLink.getLink(ceramic, ceramic.did.id, testConfig.id)
            assert.deepStrictEqual(fetchedStorageConfig, storageConfig, 'Fetched storage config matches the submitted storage config')
        })

        it('can link a DID to multiple secure storage contexts', async function() {
            const ceramic = await utils.createAccount('ethr', ETH_PRIVATE_KEY)
            let storageConfig = Object.assign({}, testConfig)
            storageConfig.id = TEST_APP_NAME2
            await StorageLink.setLink(ceramic, ceramic.did.id, storageConfig)
            const fetchedStorageConfig = await StorageLink.getLink(ceramic, ceramic.did.id, TEST_APP_NAME2)
            assert.deepStrictEqual(fetchedStorageConfig, storageConfig, 'Fetched storage config matches the submitted storage config')

            const allConfigs = await StorageLink.getLinks(ceramic, ceramic.did.id)
            assert.equal(allConfigs.length, 2, 'Have two storage context configs')
        })

        it('can unlink secure storage contexts from a DID', async function() {
            const ceramic = await utils.createAccount('ethr', ETH_PRIVATE_KEY)
            const removed = await StorageLink.unlink(ceramic, ceramic.did.id, TEST_APP_NAME2)
            assert.ok(removed, 'Successfully unlinked storage context')
            const fetchedStorageConfig = await StorageLink.getLink(ceramic, ceramic.did.id, TEST_APP_NAME2)
            assert.ok(fetchedStorageConfig == undefined, 'Storage config no longer exists')
        })

        it('ensures a DID can only have one secure context for a given context name', async function() {
            // TODO
        })

        after(async () => {
            // Cleanup and unlink all contexts
            const ceramic = await utils.createAccount('ethr', ETH_PRIVATE_KEY)
            const idx = new IDX({ ceramic })

            await idx.set(StorageLink.schemaId, {
                contexts: []
            })
        })
    })
});
