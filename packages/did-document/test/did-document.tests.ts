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
            const doc = new DIDDocument(did)
            const data = doc.export()

            assert.ok(doc)
            assert.equal(did, data.id, 'Document ID matches DID')
        })

        it('can add a context', async function() {
            const doc = new DIDDocument(did)
            await doc.addContext(CONTEXT_NAME, keyring, endpoints)

            const data = doc.export()

            // Validate service endpoints
            assert.equal(data.service.length, 2, "Have two service entries")
            function validateServiceEndpoint(type, endpointUri, actual: ServiceEndpoint) {
                assert.equal(actual.id, `did:vda:0xb194a2809b5b3b8aae350d85233439d32b361694?context=0x2d23fba7467f275904b4bc474c816ff37056ae8436ddfc555747613945034a91#${type}`, "Endpoint ID matches hard coded value")
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
            const doc = new DIDDocument(did)
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
            assert.equal(data.verificationMethod.length, 5, "Have five verificationMethod entries")
        })

        it('can remove a context', async function() {
            const doc = new DIDDocument(did)
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
        it('can sign and verify a proof', async function() {
            const doc = new DIDDocument(did)
            await doc.addContext(CONTEXT_NAME, keyring, endpoints)

            doc.signProof(wallet.privateKey)
            assert.ok(doc.verifyProof(), "Proof is valid")

            const data = doc.export()
            assert.ok(data.proof, "Proof still exists after verification")
        })
    })

})