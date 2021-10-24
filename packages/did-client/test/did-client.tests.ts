'use strict'
const assert = require('assert')

import { DIDClient } from "../src/index"
import { Wallet, utils } from 'ethers'
import { Keyring } from '@verida/keyring'
import { Interfaces, DIDDocument } from "@verida/did-document"
import { ServiceEndpoint } from "did-resolver"

const Endpoints = Interfaces.Endpoints
const EndpointType = Interfaces.EndpointType

const wallet = Wallet.createRandom()

const address = wallet.address.toLowerCase()
const did = `did:vda:${address}`

const CONTEXT_NAME = 'Verida: Test DID Context'
const DID_REGISTRY_ENDPOINT = 'http://localhost:5001'

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

const didClient = new DIDClient(DID_REGISTRY_ENDPOINT)

/**
 * 
 */
describe('DID document tests', () => {

    describe('Document creation', function() {
        it('can create an empty document', async function() {
            const doc = new DIDDocument(did)
            doc.signProof(wallet.privateKey)
            const saved = await didClient.save(doc)

            assert.ok(saved)
        })

        it('can fetch an existing document', async function() {
            const doc = await didClient.get(did)
            assert.ok(doc)

            assert.equal(doc.id, did, 'Retreived document has matching DID')
        })

        it('can add a context to an existing DID and verify', async function() {
            const initialDoc = new DIDDocument(did)
            await initialDoc.addContext(CONTEXT_NAME, keyring, endpoints)
            initialDoc.signProof(wallet.privateKey)
            const saved = await didClient.save(initialDoc)

            assert.ok(saved)

            const doc = await didClient.get(did)
            const data = doc.export()

            const contextHash = initialDoc.generateContextHash(CONTEXT_NAME)

            // Validate service endpoints
            assert.equal(data.service.length, 2, "Have two service entries")
            function validateServiceEndpoint(type, endpointUri, actual: ServiceEndpoint) {
                assert.equal(actual.id, `${did}?context=${contextHash}#${type}`, "Endpoint ID matches hard coded value")
                assert.equal(actual.type, type, "Type has expected value")
                assert.equal(actual.serviceEndpoint, endpointUri, "Endpoint has expected value")
            }

            const endpoint1 = doc.locateServiceEndpoint(CONTEXT_NAME, EndpointType.DATABASE)
            validateServiceEndpoint(endpoints.database.type, endpoints.database.endpointUri, endpoint1)

            const endpoint2 = doc.locateServiceEndpoint(CONTEXT_NAME, EndpointType.MESSAGING)
            validateServiceEndpoint(endpoints.messaging.type, endpoints.messaging.endpointUri, endpoint2)

            // @todo: validate verification method
            assert.equal(data.verificationMethod.length, 2, "Have two verificationMethod entries")
        })

        it('can handle invalid DIDs', async function() {
            const doc1 = await didClient.get(`did:vda:0xabcd`)
            assert.ok(!doc1, 'Document not returned')

            const doc2 = await didClient.get(`did:vda`)
            assert.ok(!doc2, 'Document not returned')

            const doc3 = await didClient.get("")
            assert.ok(!doc3, 'Document not returned')
        })
    })

})