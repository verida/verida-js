'use strict'
const assert = require('assert')

import { StorageLink } from '../src/index'
import { Keyring } from '@verida/keyring'
import EncryptionUtils from '@verida/encryption-utils'
import { DIDDocument } from '@verida/did-document'
import { Wallet } from 'ethers'
import { getDIDClient } from './utils'
import { DIDClient } from '@verida/did-client'
import { Network, SecureContextConfig } from '@verida/types'
import { CONTEXT_NAME } from './utils'

const NETWORK = Network.BANKSIA
const wallet = Wallet.createRandom()

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

console.log(wallet.mnemonic)
const address = wallet.address.toLowerCase()
const DID = `did:vda:polamoy:${address}`

// Test config
const testConfig: SecureContextConfig = {
    id: CONTEXT_NAME,
    publicKeys: {
        signKey: {
            type: 'EcdsaSecp256k1VerificationKey2019',
            publicKeyHex: ''
        },
        asymKey: {
            type: 'Curve25519EncryptionPublicKey',
            publicKeyHex: ''
        }
    },
    services: {
        databaseServer: {
            type: 'VeridaDatabase',
            endpointUri: ['https://storage.endpoint:443/']
        },
        messageServer: {
            type: 'VeridaMessage',
            endpointUri: ['https://message.endpoint:443/']
        }
    }
}
const expectedConfig: SecureContextConfig = {
    id: CONTEXT_NAME,
    publicKeys: {
        signKey: {
            type: 'EcdsaSecp256k1VerificationKey2019',
            publicKeyHex: ''
        },
        asymKey: {
            type: 'Curve25519EncryptionPublicKey',
            publicKeyHex: ''
        }
    },
    services: {
        databaseServer: {
            type: 'VeridaDatabase',
            endpointUri: ['https://storage.endpoint:443/']
        },
        messageServer: {
            type: 'VeridaMessage',
            endpointUri: ['https://message.endpoint:443/']
        }
    }
}
const TEST_APP_NAME2 = 'Test App 2'

let didClient: DIDClient, keyring1: Keyring, keyring2: Keyring

async function buildKeyring(did: string, contextName: string) {
    did = did.toLowerCase()
    const consentMessage = `Do you wish to unlock this storage context: "${contextName}"?\n\n${did}`
    const signature = await EncryptionUtils.signData(consentMessage, Buffer.from(wallet.privateKey.substring(2), 'hex'))
    return new Keyring(signature)
}

describe('Storage Link', () => {
    before(async () => {
        didClient = await getDIDClient(wallet)
        keyring1 = await buildKeyring(DID, CONTEXT_NAME)
        keyring2 = await buildKeyring(DID, TEST_APP_NAME2)
    })

    describe('Manage DID Links', async function() {
        this.timeout(100 * 1000)

        it('can link a DID to a secure storage context', async function() {
            const keys = await keyring1.publicKeys()
            expectedConfig.publicKeys.signKey.publicKeyHex = keys.signPublicKeyHex
            expectedConfig.publicKeys.asymKey.publicKeyHex = keys.asymPublicKeyHex
            testConfig.publicKeys.signKey.publicKeyHex = keys.signPublicKeyHex
            testConfig.publicKeys.asymKey.publicKeyHex = keys.asymPublicKeyHex

            let storageConfig = Object.assign({}, expectedConfig)

            const success = await StorageLink.setLink(NETWORK, didClient, testConfig, keyring1, wallet.privateKey)
            assert.ok(success, 'Set link succeeded')
            const links = await StorageLink.getLinks(NETWORK, didClient, DID)
            assert.ok(links.length, 1, 'Fetched exactly one saved link')

            const fetchedStorageConfig = await StorageLink.getLink(NETWORK, didClient, DID, testConfig.id)
            storageConfig.id = DIDDocument.generateContextHash(DID, CONTEXT_NAME)
            
            assert.deepStrictEqual(fetchedStorageConfig, storageConfig, 'Fetched storage config matches the expected storage config')
        })

        it('can link a DID to multiple secure storage contexts', async function() {
            await sleep(1000)
            let storageConfig = Object.assign({}, expectedConfig)
            storageConfig.id = TEST_APP_NAME2
            await StorageLink.setLink(NETWORK, didClient, storageConfig, keyring2, wallet.privateKey)

            const fetchedStorageConfig = await StorageLink.getLink(NETWORK, didClient, DID, TEST_APP_NAME2)
            storageConfig.id = DIDDocument.generateContextHash(DID, TEST_APP_NAME2)

            const keys = await keyring2.publicKeys()
            storageConfig.publicKeys.signKey.publicKeyHex = keys.signPublicKeyHex
            storageConfig.publicKeys.asymKey.publicKeyHex = keys.asymPublicKeyHex

            assert.deepStrictEqual(fetchedStorageConfig, storageConfig, 'Fetched storage config matches the submitted storage config')

            const allConfigs = await StorageLink.getLinks(NETWORK, didClient, DID)
            assert.equal(allConfigs.length, 2, 'Have two storage context configs')
        })

        it('can unlink secure storage contexts from a DID', async function() {
            await sleep(1000)
            const removed = await StorageLink.unlink(NETWORK, didClient, TEST_APP_NAME2)
            assert.ok(removed, 'Successfully unlinked storage context')

            const fetchedStorageConfig = await StorageLink.getLink(NETWORK, didClient, DID, TEST_APP_NAME2)
            assert.ok(fetchedStorageConfig == undefined, 'Storage config no longer exists')
        })

        /*it('ensures a DID can only have one secure context for a given context name', async function() {
            // @todo
        })*/

        /*after(async () => {
            // Cleanup and remove all contexts by creating an empty DID document
            const didDocument = new DIDDocument(DID, didClient.getPublicKey())
            await didClient.save(didDocument)
        })*/
    })
});
