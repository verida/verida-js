'use strict'
const assert = require('assert')

import { DIDDocument } from "../src/index"
import { Wallet } from 'ethers'
import { Keyring } from '@verida/keyring'
import { ServiceEndpoint } from "did-resolver"
import { SecureContextEndpoints, SecureContextEndpointType } from "@verida/types"

const mnemonic = "slight crop cactus cute trend tape undo exile retreat large clay average"
const wallet = Wallet.fromMnemonic(mnemonic)

const address = wallet.address.toLowerCase()
const did = `did:vda:${address}`

const CONTEXT_NAME = 'Verida: Test DID Context'
const CONTEXT_NAME_2 = 'Verida: Test DID Context 2'

const keyring = new Keyring(wallet.mnemonic.phrase)

const endpoints: SecureContextEndpoints = {
    database: {
        type: SecureContextEndpointType.DATABASE,
        endpointUri: ['https://db.testnet.verida.io/1']
    },
    messaging: {
        type: SecureContextEndpointType.MESSAGING,
        endpointUri: ['https://db.testnet.verida.io/2']
    }
}

const endpointsMultiple: SecureContextEndpoints = {
    database: {
        type: SecureContextEndpointType.DATABASE,
        endpointUri: ['https://db.testnet.verida.io/1', 'https://db2.testnet.verida.io/1']
    },
    messaging: {
        type: SecureContextEndpointType.MESSAGING,
        endpointUri: ['https://db.testnet.verida.io/2', 'https://db2.testnet.verida.io/2']
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
            await doc.addContext(CONTEXT_NAME, keyring, wallet.privateKey, endpoints)

            const data = doc.export()

            // Validate service endpoints
            assert.equal(data.service?.length, 2, "Have two service entries")
            function validateServiceEndpoint(type, endpointUri, actual: ServiceEndpoint) {
                assert.equal(actual.id, `did:vda:0xb194a2809b5b3b8aae350d85233439d32b361694?context=0x2d23fba7467f275904b4bc474c816ff37056ae8436ddfc555747613945034a91&type=${type}`, "Endpoint ID matches hard coded value")
                assert.equal(actual.type, type, "Type has expected value")
                assert.equal(actual.serviceEndpoint, endpointUri, "Endpoint has expected value")
            }

            const endpoint1 = doc.locateServiceEndpoint(CONTEXT_NAME, SecureContextEndpointType.DATABASE)
            validateServiceEndpoint(endpoints.database.type, endpoints.database.endpointUri, endpoint1)

            const endpoint2 = doc.locateServiceEndpoint(CONTEXT_NAME, SecureContextEndpointType.MESSAGING)
            validateServiceEndpoint(endpoints.messaging.type, endpoints.messaging.endpointUri, endpoint2)

            // @todo: validate verification method
            assert.equal(data.verificationMethod?.length, 4, "Have four verificationMethod entries")

            // @todo: verify proof
            const proofVerificationMethod = data.verificationMethod![2]
            assert.ok((proofVerificationMethod as any).proof && proofVerificationMethod.type == 'EcdsaSecp256k1VerificationKey2019', 'Proof property is set on the signing verification method')

            // @todo: validate signing key

            // @todo: validate asymmetric key
        })
    })

    describe('Document changes', function() {
        it('can add multiple contexts', async function() {
            const doc = new DIDDocument(did, wallet.publicKey)
            await doc.addContext(CONTEXT_NAME, keyring, wallet.privateKey, endpoints)
            await doc.addContext(CONTEXT_NAME_2, keyring, wallet.privateKey, endpoints)

            const data = doc.export()
            assert.equal(data.service?.length, 4, "Have four service entries")

            // Check we have both endpoints for context 1
            const endpoint1 = doc.locateServiceEndpoint(CONTEXT_NAME, SecureContextEndpointType.DATABASE)
            assert.ok(endpoint1, "Have database endpoint for context 1")
            const endpoint2 = doc.locateServiceEndpoint(CONTEXT_NAME, SecureContextEndpointType.MESSAGING)
            assert.ok(endpoint2, "Have messaging endpoint for context 1")

            // Check we have both endpoints for context 2
            const endpoint3 = doc.locateServiceEndpoint(CONTEXT_NAME_2, SecureContextEndpointType.DATABASE)
            assert.ok(endpoint3, "Have database endpoint for context 2")
            const endpoint4 = doc.locateServiceEndpoint(CONTEXT_NAME_2, SecureContextEndpointType.MESSAGING)
            assert.ok(endpoint4, "Have messaging endpoint for context 2")

            // @todo: validate verification method
            assert.equal(data.verificationMethod!.length, 6, "Have six verificationMethod entries")
        })

        it('can add a context with multiple endpoints', async function() {
            const doc = new DIDDocument(did, wallet.publicKey)
            await doc.addContext(CONTEXT_NAME, keyring, wallet.privateKey, endpointsMultiple)

            const data = doc.export()
            assert.ok(data.service, 'Service exists')
            assert.equal(data.service!.length, 2, 'Service has four entries')
            assert.equal(data.service![0].serviceEndpoint.length, 2, 'First service has two endpoints')
            assert.equal(data.service![1].serviceEndpoint.length, 2, 'Second service has two endpoints')
        })

        it('can remove a context', async function() {
            const doc = new DIDDocument(did, wallet.publicKey)
            await doc.addContext(CONTEXT_NAME, keyring, wallet.privateKey, endpoints)
            await doc.addContext(CONTEXT_NAME_2, keyring, wallet.privateKey, endpoints)

            // Confirm we have two contexts
            const data2 = doc.export()
            assert.equal(data2.service!.length, 4, "Have four service entries after adding a service")
            assert.equal(data2.verificationMethod!.length, 6, "Have six verificationMethod entries after adding a service")
            assert.equal(data2.assertionMethod!.length, 6, "Have six assertionMethod entries after adding a service")
            assert.equal(data2.keyAgreement!.length, 2, 'Have two keyAgreements after adding a service')

            // Remove a context
            const success = await doc.removeContext(CONTEXT_NAME)
            assert.ok(success, "Remove was successful")
            const data = doc.export()

            // Confirm we have the correct number of entries
            assert.equal(data.service!.length, 2, "Have two service entries after removing a service")
            assert.equal(data.verificationMethod!.length, 4, "Have four verificationMethod entries after removing a service")
            assert.equal(data.assertionMethod!.length, 4, "Have four assertionMethod entries after removing a service")
            assert.equal(data.keyAgreement!.length, 1, 'Have two keyAgreements after removing a service')

            // @todo deeper validation of signatures and service endpoints
        })

        it('can replace an existing context, not add again', async function() {
            const doc = new DIDDocument(did, wallet.publicKey)

            // Add the same context twice in a row
            await doc.addContext(CONTEXT_NAME, keyring, wallet.privateKey, endpoints)
            await doc.addContext(CONTEXT_NAME, keyring, wallet.privateKey, endpoints)

            const data = doc.export()
            assert.equal(data.service!.length, 2, "Have two service entries")
            assert.equal(data.verificationMethod?.length, 4, 'Have four verification methods')
            assert.equal(data.assertionMethod?.length, 4, 'Have four assertionMethods')
            assert.equal(data.keyAgreement?.length, 1, 'Have one keyAgreement')
        })
    })

    describe.only('Document signing and verification', function() {
        it('can sign and verify any context data', async function() {
            const doc = new DIDDocument(did, wallet.publicKey)
            await doc.addContext(CONTEXT_NAME, keyring, wallet.privateKey, endpoints)

            const signData = {
                hello: 'world'
            }
            const signature = await keyring.sign(signData)
            const valid = doc.verifyContextSignature(signData, CONTEXT_NAME, signature)

            assert.ok(valid, "Signature is valid")
        })
    })

})