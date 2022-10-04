'use strict'
const assert = require('assert')

import { StorageLink } from '../src/index'
import { SecureContextConfig } from '../src/interfaces'
import { DIDClient } from '@verida/did-client'
import { DIDDocument } from '@verida/did-document'
import { Wallet } from 'ethers'
import { getDIDClient } from './utils'

//const MNEMONIC = "slight crop cactus cute trend tape undo exile retreat large clay average"
//const DID_SERVER_URL = 'http://localhost:5001'

const wallet = Wallet.createRandom()

const CONTEXT_NAME = 'Test App'

//didClient.authenticate(MNEMONIC)

const address = wallet.address.toLowerCase()
const DID = `did:vda:testnet:${address}`


// Test config
const testConfig: SecureContextConfig = {
    id: CONTEXT_NAME,
    publicKeys: {
        signKey: {
            type: 'EcdsaSecp256k1VerificationKey2019',
            publicKeyHex: '0x970c1016f3efe4c0ac1b404c38a9cfab5a545b36d07d3c3e41f2109a166ecdfd'
        },
        asymKey: {
            type: 'Curve25519EncryptionPublicKey',
            publicKeyHex: '0x270c1016f3efe4c0ac1b404c38a9cfab5a545b36d07d3c3e41f2109a166ecdfd'
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
const expectedConfig: SecureContextConfig = {
    id: CONTEXT_NAME,
    publicKeys: {
        signKey: {
            type: 'EcdsaSecp256k1VerificationKey2019',
            publicKeyHex: '0x970c1016f3efe4c0ac1b404c38a9cfab5a545b36d07d3c3e41f2109a166ecdfd'
        },
        asymKey: {
            type: 'Curve25519EncryptionPublicKey',
            publicKeyHex: '0x270c1016f3efe4c0ac1b404c38a9cfab5a545b36d07d3c3e41f2109a166ecdfd'
        }
    },
    services: {
        databaseServer: {
            type: 'VeridaDatabase',
            endpointUri: 'https://storage.endpoint/'
        },
        messageServer: {
            type: 'VeridaMessage',
            endpointUri: 'https://message.endpoint/'
        }
    }
}
const TEST_APP_NAME2 = 'Test App 2'

let didClient

describe('Storage Link', () => {
    before(async () => {
        didClient = await getDIDClient(wallet)
    })

    describe('Manage DID Links', async function() {
        this.timeout(100000)

        it('can link a DID to a secure storage context', async function() {
            let storageConfig = Object.assign({}, expectedConfig)

            const success = await StorageLink.setLink(didClient, testConfig)
            assert.ok(success, 'Set link succeeded')
            const links = await StorageLink.getLinks(didClient, DID)

            const fetchedStorageConfig = await StorageLink.getLink(didClient, DID, testConfig.id)
            storageConfig.id = DIDDocument.generateContextHash(DID, CONTEXT_NAME)

            assert.deepStrictEqual(fetchedStorageConfig, storageConfig, 'Fetched storage config matches the expected storage config')
        })

        it('can link a DID to multiple secure storage contexts', async function() {
            let storageConfig = Object.assign({}, expectedConfig)
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
            // @todo
        })

        /*after(async () => {
            // Cleanup and remove all contexts by creating an empty DID document
            const didDocument = new DIDDocument(DID, didClient.getPublicKey())
            await didClient.save(didDocument)
        })*/
    })
});
