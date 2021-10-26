'use strict'
const assert = require('assert')

import { StorageLink } from '../src/index'
import { SecureContextConfig } from '../src/interfaces'
import { DIDClient } from '@verida/did-client'
import { DIDDocument } from '@verida/did-document'

const MNEMONIC = "slight crop cactus cute trend tape undo exile retreat large clay average"
const DID_SERVER_URL = 'http://localhost:5001'

const CONTEXT_NAME = 'Test App'

const didClient = new DIDClient(DID_SERVER_URL)
didClient.authenticate(MNEMONIC)
const DID = didClient.getDid()


// Test config
const testConfig: SecureContextConfig = {
    id: CONTEXT_NAME,
    publicKeys: {
        signKey: {
            type: 'EcdsaSecp256k1VerificationKey2019',
            base58: 'HtJ9j1kWdohkGBhgrWjPTa8UkzEdfTJvF93eMzJJ9Za6'
        },
        asymKey: {
            type: 'Curve25519EncryptionPublicKey',
            base58: '2oCCWT6ryrrDjTDbUFYJ4Q6RiN9n4ZMKeZCgf6qY81Dh'
        }
    },
    services: {
        databaseServer: {
            type: 'VeridaDatabase',
            endpointUri: 'https://storage.endpoint'
        },
        messageServer: {
            type: 'VeridaMessage',
            endpointUri: 'https://message.endpoint'
        }
    }
}
const TEST_APP_NAME2 = 'Test App 2'

describe('Storage Link', () => {
    describe('Manage DID Links', async function() {
        this.timeout(100000)

        it('can link a DID to a secure storage context', async function() {
            let storageConfig = Object.assign({}, testConfig)
            await StorageLink.setLink(didClient, storageConfig)
            const links = await StorageLink.getLinks(didClient, DID)

            const fetchedStorageConfig = await StorageLink.getLink(didClient, DID, testConfig.id)
            storageConfig.id = DIDDocument.generateContextHash(DID, CONTEXT_NAME)
            assert.deepStrictEqual(fetchedStorageConfig, storageConfig, 'Fetched storage config matches the submitted storage config')
        })

        it('can link a DID to multiple secure storage contexts', async function() {
            let storageConfig = Object.assign({}, testConfig)
            storageConfig.id = TEST_APP_NAME2
            await StorageLink.setLink(didClient, storageConfig)
            const fetchedStorageConfig = await StorageLink.getLink(didClient, DID, TEST_APP_NAME2)
            storageConfig.id = DIDDocument.generateContextHash(DID, TEST_APP_NAME2)
            assert.deepStrictEqual(fetchedStorageConfig, storageConfig, 'Fetched storage config matches the submitted storage config')

            const allConfigs = await StorageLink.getLinks(didClient, DID)
            assert.equal(allConfigs.length, 2, 'Have two storage context configs')
        })

        it('can unlink secure storage contexts from a DID', async function() {
            const removed = await StorageLink.unlink(didClient, TEST_APP_NAME2)
            assert.ok(removed, 'Successfully unlinked storage context')

            const fetchedStorageConfig = await StorageLink.getLink(didClient, DID, TEST_APP_NAME2)
            assert.ok(fetchedStorageConfig == undefined, 'Storage config no longer exists')
        })

        it('ensures a DID can only have one secure context for a given context name', async function() {
            // TODO
        })

        after(async () => {
            // Cleanup and remove all contexts by creating an empty DID document
            const didDocument = new DIDDocument(DID)
            await didClient.save(didDocument)
        })
    })
});
