'use strict'
const assert = require('assert')

import { DIDDocument } from "../src/index"
import { Wallet, utils } from 'ethers'
import { Keyring } from '@verida/keyring'
import { Endpoints, EndpointType } from "../src/interfaces"
import { ServiceEndpoint } from "did-resolver"

const mnemonic = "slight crop cactus cute trend tape undo exile retreat large clay average"
const wallet = Wallet.fromMnemonic(mnemonic)

const address = wallet.address.toLowerCase()
const did = `did:vda:${address}`

const CONTEXT_NAME = 'Verida: Test DID Context'
const CONTEXT_NAME_2 = 'Verida: Test DID Context 2'

const keyring = new Keyring(wallet.mnemonic.phrase)

const endpoints: Endpoints = {
    database: {
        type: EndpointType.DATABASE,
        endpointUri: 'https://db.testnet.verida.io/1'
    },
    messaging: {
        type: EndpointType.MESSAGING,
        endpointUri: 'https://db.testnet.verida.io/2'
    }
}

/**
 * 
 */
describe('DID document tests', () => {

    describe('Document creation', function() {
        it('can create an empty document', async function() {
            const doc = new DIDDocument(did, wallet.publicKey)
            const data = doc.export()

            assert.ok(doc)
            assert.equal(did, data.id, 'Document ID matches DID')
        })

        it('can add a context', async function() {
            const doc = new DIDDocument(did, wallet.publicKey)
            await doc.addContext(CONTEXT_NAME, keyring, endpoints)

            const data = doc.export()

            // Validate service endpoints
            assert.equal(data.service.length, 2, "Have two service entries")
            function validateServiceEndpoint(type, endpointUri, actual: ServiceEndpoint) {
                assert.equal(actual.id, `did:vda:0xb194a2809b5b3b8aae350d85233439d32b361694?context=0x2d23fba7467f275904b4bc474c816ff37056ae8436ddfc555747613945034a91&type=${type}`, "Endpoint ID matches hard coded value")
                assert.equal(actual.type, type, "Type has expected value")
                assert.equal(actual.serviceEndpoint, endpointUri, "Endpoint has expected value")
            }

            const endpoint1 = doc.locateServiceEndpoint(CONTEXT_NAME, EndpointType.DATABASE)
            validateServiceEndpoint(endpoints.database.type, endpoints.database.endpointUri, endpoint1)

            const endpoint2 = doc.locateServiceEndpoint(CONTEXT_NAME, EndpointType.MESSAGING)
            validateServiceEndpoint(endpoints.messaging.type, endpoints.messaging.endpointUri, endpoint2)

            // @todo: validate verification method
            assert.equal(data.verificationMethod.length, 3, "Have three verificationMethod entries")

            // @todo: validate signing key

            // @todo: validate asymmetric key
        })
    })

    describe('Document changes', function() {
        it('can add multiple contexts', async function() {
            const doc = new DIDDocument(did, wallet.publicKey)
            await doc.addContext(CONTEXT_NAME, keyring, endpoints)
            await doc.addContext(CONTEXT_NAME_2, keyring, endpoints)

            const data = doc.export()
            assert.equal(data.service.length, 4, "Have four service entries")

            // Check we have both endpoints for context 1
            const endpoint1 = doc.locateServiceEndpoint(CONTEXT_NAME, EndpointType.DATABASE)
            assert.ok(endpoint1, "Have database endpoint for context 1")
            const endpoint2 = doc.locateServiceEndpoint(CONTEXT_NAME, EndpointType.MESSAGING)
            assert.ok(endpoint2, "Have messaging endpoint for context 1")

            // Check we have both endpoints for context 2
            const endpoint3 = doc.locateServiceEndpoint(CONTEXT_NAME_2, EndpointType.DATABASE)
            assert.ok(endpoint3, "Have database endpoint for context 2")
            const endpoint4 = doc.locateServiceEndpoint(CONTEXT_NAME_2, EndpointType.MESSAGING)
            assert.ok(endpoint4, "Have messaging endpoint for context 2")

            // @todo: validate verification method
            assert.equal(data.verificationMethod!.length, 5, "Have five verificationMethod entries")
        })

        it('can remove a context', async function() {
            const doc = new DIDDocument(did, wallet.publicKey)
            await doc.addContext(CONTEXT_NAME, keyring, endpoints)
            await doc.addContext(CONTEXT_NAME_2, keyring, endpoints)

            // Confirm we have two contexts
            const data2 = doc.export()
            assert.equal(data2.service.length, 4, "Have four service entries")

            // Remove a context
            const success = await doc.removeContext(CONTEXT_NAME)
            assert.ok(success, "Remove was successful")
            const data = doc.export()

            // Confirm we have the correct number of entries
            assert.equal(data.service.length, 2, "Have two service entries")
            assert.equal(data.verificationMethod.length, 3, "Have three verificationMethod entries")

            // @todo deeper validation of signatures and service endpoints
        })
    })

    describe('Document signing and verification', function() {
        it('can sign and verify any context data', async function() {
            const doc = new DIDDocument(did, wallet.publicKey)
            await doc.addContext(CONTEXT_NAME, keyring, endpoints)

            const signData = {
                hello: 'world'
            }
            const signature = await keyring.sign(signData)
            const valid = doc.verifyContextSignature(signData, CONTEXT_NAME, signature)

            assert.ok(valid, "Signature is valid")
        })
    })

    describe('Document comparison', function() {
        it('can correctly identify added records', async function() {
            const doc1 = new DIDDocument(did, wallet.publicKey)
            await doc1.addContext(CONTEXT_NAME, keyring, endpoints)

            const doc2 = new DIDDocument({
                id: did,
                controller: `${did}-2`
            }, wallet.publicKey)
            await doc2.addContext(CONTEXT_NAME, keyring, endpoints)
            await doc2.addContext(CONTEXT_NAME_2, keyring, endpoints)

            const compareResult: any = doc1.compare(doc2)

            // Verify controller has changed
            assert.equal(compareResult.controller, `${did}-2`, 'controller is correct')

            // Verify service
            assert.deepEqual(compareResult.add.verificationMethod, [
                {
                    id: `${did}?context=0xf955c80c778cbe78c9903fa30e157d9d69d76b0a67bbbc0d3c97affeb2cdbb3a&type=sign`,
                    type: 'EcdsaSecp256k1VerificationKey2019',
                    controller: did,
                    publicKeyHex: '0x03d9e1ea9cc5de0f1d2e34e9ac6502ecee77df8410c1cf641505d4910a99769690'
                },
                {
                    id: `${did}?context=0xf955c80c778cbe78c9903fa30e157d9d69d76b0a67bbbc0d3c97affeb2cdbb3a&type=asym`,
                    type: 'X25519KeyAgreementKey2019',
                    controller: did,
                    publicKeyHex: '0x7111bd092060f001ccddda39a61d591fafc9005535205001b0ace589dc087f3a'
                }
            ], 'verificationMethod/add is correct')
            assert.deepEqual(compareResult.remove.verificationMethod, [
                // As we manually set the controller, the DID verification method wasn't auto generated
                {
                    id: `${did}`,
                    type: 'EcdsaSecp256k1VerificationKey2019',
                    controller: did,
                    publicKeyHex: '0x048e07cef8dae5b156c3b504c3d09d7a1f038461a9c546e3654d8c2a5189c313cc0bd0aaac0cbfcf5e12895bcf4d1347f6ca14d7e546c96e0ad7acae45e07d13ae'
                  }
            ], 'verificationMethod/remove is correct')

            // Verify assertionMethod
            assert.deepEqual(compareResult.add.assertionMethod, [
                `${did}?context=0xf955c80c778cbe78c9903fa30e157d9d69d76b0a67bbbc0d3c97affeb2cdbb3a&type=sign`
            ], 'assertionMethod/add is correct')
            assert.deepEqual(compareResult.remove.assertionMethod, [
                // // As we manually set the controller, the DID assertion method wasn't auto generated
                'did:vda:0xb194a2809b5b3b8aae350d85233439d32b361694'
            ], 'assertionMethod/remove is correct')

            // Verify service
            assert.deepEqual(compareResult.add.service, [
                {
                    id: `${did}?context=0xf955c80c778cbe78c9903fa30e157d9d69d76b0a67bbbc0d3c97affeb2cdbb3a&type=database`,
                    type: endpoints.database.type,
                    serviceEndpoint: endpoints.database.endpointUri
                },
                {
                    id: `${did}?context=0xf955c80c778cbe78c9903fa30e157d9d69d76b0a67bbbc0d3c97affeb2cdbb3a&type=messaging`,
                    type: endpoints.messaging.type,
                    serviceEndpoint: endpoints.messaging.endpointUri
                }
            ], 'service/add is correct')
            assert.deepEqual(compareResult.remove.service, [], 'service/remove is correct')

            // Verify keyAgreement
            assert.deepEqual(compareResult.add.keyAgreement, [
                `${did}?context=0xf955c80c778cbe78c9903fa30e157d9d69d76b0a67bbbc0d3c97affeb2cdbb3a&type=asym`
            ], 'keyAgreement/add is correct')
            assert.deepEqual(compareResult.remove.keyAgreement, [], 'keyAgreement/remove is correct')
        })

        it('can correctly identify removed records', async function() {
            const doc1 = new DIDDocument(did, wallet.publicKey)
            await doc1.addContext(CONTEXT_NAME, keyring, endpoints)

            const doc2 = new DIDDocument(did, wallet.publicKey)
            await doc2.addContext(CONTEXT_NAME, keyring, endpoints)
            await doc2.addContext(CONTEXT_NAME_2, keyring, endpoints)

            // Compare in the opposite direction to identify removals
            const compareResult: any = doc2.compare(doc1)

            // Verify controller hasn't changed
            assert.equal(compareResult.controller, undefined, 'controller is correct')

            // Verify service
            assert.deepEqual(compareResult.remove.verificationMethod, [
                {
                    id: `${did}?context=0xf955c80c778cbe78c9903fa30e157d9d69d76b0a67bbbc0d3c97affeb2cdbb3a&type=sign`,
                    type: 'EcdsaSecp256k1VerificationKey2019',
                    controller: did,
                    publicKeyHex: '0x03d9e1ea9cc5de0f1d2e34e9ac6502ecee77df8410c1cf641505d4910a99769690'
                },
                {
                    id: `${did}?context=0xf955c80c778cbe78c9903fa30e157d9d69d76b0a67bbbc0d3c97affeb2cdbb3a&type=asym`,
                    type: 'X25519KeyAgreementKey2019',
                    controller: did,
                    publicKeyHex: '0x7111bd092060f001ccddda39a61d591fafc9005535205001b0ace589dc087f3a'
                }
            ], 'verificationMethod/remove is correct')
            assert.deepEqual(compareResult.add.verificationMethod, [], 'verificationMethod/add is correct')

            // Verify assertionMethod
            assert.deepEqual(compareResult.remove.assertionMethod, [
                `${did}?context=0xf955c80c778cbe78c9903fa30e157d9d69d76b0a67bbbc0d3c97affeb2cdbb3a&type=sign`
            ], 'assertionMethod/remove is correct')
            assert.deepEqual(compareResult.add.assertionMethod, [], 'assertionMethod/add is correct')

            // Verify service
            assert.deepEqual(compareResult.remove.service, [
                {
                    id: `${did}?context=0xf955c80c778cbe78c9903fa30e157d9d69d76b0a67bbbc0d3c97affeb2cdbb3a&type=database`,
                    type: endpoints.database.type,
                    serviceEndpoint: endpoints.database.endpointUri
                },
                {
                    id: `${did}?context=0xf955c80c778cbe78c9903fa30e157d9d69d76b0a67bbbc0d3c97affeb2cdbb3a&type=messaging`,
                    type: endpoints.messaging.type,
                    serviceEndpoint: endpoints.messaging.endpointUri
                }
            ], 'service/remove is correct')
            assert.deepEqual(compareResult.add.service, [], 'service/add is correct')

            // Verify keyAgreement
            assert.deepEqual(compareResult.remove.keyAgreement, [
                `${did}?context=0xf955c80c778cbe78c9903fa30e157d9d69d76b0a67bbbc0d3c97affeb2cdbb3a&type=asym`
            ], 'keyAgreement/remove is correct')
            assert.deepEqual(compareResult.add.keyAgreement, [], 'add/remove is correct')
        })
    })

})