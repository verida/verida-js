'use strict'
const assert = require('assert')

import { Wallet } from 'ethers'
import { Keyring } from '@verida/keyring'
import { DIDDocument } from "@verida/did-document"
import { ServiceEndpoint } from "did-resolver"

import { getDIDClient } from "./utils"
import { SecureContextEndpointType } from '@verida/types'

const wallet = Wallet.createRandom()

const address = wallet.address.toLowerCase()
const did = `did:vda:testnet:${address}`

const CONTEXT_NAME = 'Verida: Test DID Context'

const keyring = new Keyring(wallet.mnemonic.phrase)

const endpoints = {
    database: {
        type: SecureContextEndpointType.DATABASE,
        endpointUri: ['https://node1-euw6.gcp.devnet.verida.tech/', 'https://node2-euw6.gcp.devnet.verida.tech/', 'https://node3-euw6.gcp.devnet.verida.tech/']
    },
    messaging: {
        type: SecureContextEndpointType.MESSAGING,
        endpointUri: ['https://node1-euw6.gcp.devnet.verida.tech/', 'https://node2-euw6.gcp.devnet.verida.tech/', 'https://node3-euw6.gcp.devnet.verida.tech/']
    }
}

const didEndpoints = ['https://node1-euw6.gcp.devnet.verida.tech/did/', 'https://node2-euw6.gcp.devnet.verida.tech/did/', 'https://node3-euw6.gcp.devnet.verida.tech/did/']

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

let didClient, currentDoc

/**
 * 
 */
describe('DID Client tests', () => {

    before(async () => {
        didClient = await getDIDClient(wallet, didEndpoints)
    })

    describe('Basic tests', function() {
        it('can create an empty document', async function() {
            const doc  = new DIDDocument(did, wallet.publicKey)
            const endpointResponses = await didClient.save(doc)

            assert.ok(endpointResponses, 'Saved response')
            for (let i in endpointResponses) {
                assert.equal(endpointResponses[i].status, 'success', `${i} success`)
            }
        })

        it('can fetch an existing document', async function() {
            currentDoc = await didClient.get(did)
            assert.ok(currentDoc)

            assert.equal(currentDoc.id, did, 'Retreived document has matching DID')
        })

        it('can add a context to an existing DID and verify', async function() {
            await currentDoc.addContext(CONTEXT_NAME, keyring, wallet.privateKey, endpoints)

            // Sleep so enough time passes for the updated field to not match created
            await sleep(1000)

            try {
                const saveResponse = await didClient.save(currentDoc)
                assert.ok(saveResponse, 'DID document saved successfully')
            } catch (err) {
                console.log(didClient.getLastEndpointErrors())
                throw err
            }

            const doc = await didClient.get(did)
            const savedDoc = doc.export()

            assert.deepEqual(savedDoc, currentDoc.export(), 'Saved document matches original document')

            const contextHash = DIDDocument.generateContextHash(did, CONTEXT_NAME)

            // Validate service endpoints
            assert.equal(savedDoc.service?.length, 2, "Have two service entries")
            function validateServiceEndpoint(type, endpointUri, actual: ServiceEndpoint) {
                assert.ok(actual)
                assert.equal(actual.id, `${did}?context=${contextHash}&type=${type}`, "Endpoint ID matches hard coded value")
                assert.equal(actual.type, type, "Type has expected value")
                assert.deepEqual(actual.serviceEndpoint, endpointUri, `Endpoint (${actual.serviceEndpoint}) has expected value (${endpointUri})`)
            }

            const endpoint1 = doc.locateServiceEndpoint(CONTEXT_NAME, SecureContextEndpointType.DATABASE)
            validateServiceEndpoint(endpoints.database.type, endpoints.database.endpointUri, endpoint1)

            const endpoint2 = doc.locateServiceEndpoint(CONTEXT_NAME, SecureContextEndpointType.MESSAGING)
            validateServiceEndpoint(endpoints.messaging.type, endpoints.messaging.endpointUri, endpoint2)

            // @todo: validate verification method
            assert.equal(savedDoc.verificationMethod.length, 4, "Have four verificationMethod entries")
            assert.deepEqual(savedDoc.verificationMethod, currentDoc.export().verificationMethod, "Verification methods match")

            assert.equal(savedDoc.assertionMethod.length, 4, "Have four assertionMethod entries")
            assert.equal(savedDoc.keyAgreement.length, 1, "Have one keyAgreement entries")
        })

        it('can remove an existing context', async function() {
            const doc = await didClient.get(did)

            const removed = await doc.removeContext(CONTEXT_NAME)
            assert.ok(removed, 'Context successfully removed locally')

            const data = doc.export()

            // Validate service endpoints
            assert.equal(data.service?.length, 0, "Have no service entries")
            assert.equal(data.verificationMethod.length, 2, "Have two verificationMethod entries")
            assert.equal(data.assertionMethod.length, 2, "Have two assertionMethod entries")

            const saved = await didClient.save(doc)
            assert.ok(saved, 'Context successfully saved to blockchain')

            // Verify on chain document has the record removed
            const chainDoc = await didClient.get(did)
            const chainData = chainDoc.export()

            assert.equal(chainData.service?.length, 0, "Have no service entries")
            assert.equal(chainData.verificationMethod.length, 2, "Have two verificationMethod entries")
            assert.equal(chainData.assertionMethod.length, 2, "Have two assertionMethod entries")
        })

        it('can replace an existing context, not add again', async function() {
            try {
                const doc = await didClient.get(did)
                await doc.addContext(CONTEXT_NAME, keyring, wallet.privateKey, endpoints)

                // Sleep so enough time passes for the updated field to not match created
                await sleep(1000)
                let saved = await didClient.save(doc)
                assert.ok(saved)

                // Add the same context and save a second time
                await doc.addContext(CONTEXT_NAME, keyring, wallet.privateKey, endpoints)
                
                // Sleep so enough time passes for the updated field to not match created
                await sleep(1000)
                
                saved = await didClient.save(doc)
                assert.ok(saved)

                const data = doc.export()
                assert.equal(data.service!.length, 2, 'Have two service endpoints')
                assert.equal(data.verificationMethod!.length, 4, 'Have four verification methods')
                assert.equal(data.keyAgreement!.length, 1, 'Have one keyAgreement')
                assert.equal(data.assertionMethod!.length, 4, 'Have four assertionMethods')
            } catch (err) {
                console.log(didClient.getLastEndpointErrors())
                throw err
            }
        })

        it('can handle invalid DIDs', async function() {
            assert.rejects(didClient.get(`did:vda:0xabcd`))
            assert.rejects(didClient.get(`did:vda`))
            assert.rejects(didClient.get(""))
        })
    })

})
