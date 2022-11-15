const assert = require('assert')
import { ethers } from 'ethers'
import { DIDDocument } from '@verida/did-document'
import { CallType } from '@verida/web3'
import { getResolver } from '@verida/vda-did-resolver'
import { Resolver } from 'did-resolver'
import { randomBytes } from 'crypto'

import VdaDid from '../src/vdaDid'

const DID_PRIVATE_KEY = `0x${randomBytes(32).toString('hex')}`
const wallet = new ethers.Wallet(DID_PRIVATE_KEY)
const DID_ADDRESS = wallet.address
const DID = `did:vda:testnet:${DID_ADDRESS}`
const DID_PK = wallet.publicKey

//console.log(entropy.toString('hex'))
//console.log(entropy.reverse().toString('hex'))

const DID_PRIVATE_KEY2 = `0x${randomBytes(32).toString('hex')}`
const wallet2 = new ethers.Wallet(DID_PRIVATE_KEY2)
const DID_ADDRESS2 = wallet2.address
const DID2 = `did:vda:testnet:${DID_ADDRESS2}`
const DID_PK2 = wallet2.publicKey

console.log(`DID1: ${DID}`)
console.log(`DID2: ${DID2}`)

const vdaDidResolver = getResolver()
const didResolver = new Resolver(vdaDidResolver)

const VDA_DID_CONFIG = {
    identifier: DID,
    vdaKey: DID_PRIVATE_KEY,
    callType: <CallType> 'web3',
    web3Options: {}
}

const VDA_DID_CONFIG2 = {
    identifier: DID2,
    vdaKey: DID_PRIVATE_KEY2,
    callType: <CallType> 'web3',
    web3Options: {}
}

const ENDPOINTS = [`http://localhost:5000/did/${DID}`]
const ENDPOINT = ENDPOINTS[0].toLowerCase()

// Create a list of endpoints where one is always going to fail (port 7000 is invalid endpoint)
const ENDPOINTS_FAIL = [`http://localhost:5000/did/${DID2}`, `http://localhost:7000/did/${DID2}`]

const veridaApi = new VdaDid(VDA_DID_CONFIG)
const veridaApi2 = new VdaDid(VDA_DID_CONFIG2)

let masterDidDoc, masterDidDoc2

const NOW = new Date()
const LATER = new Date(NOW.getTime() + 60000)

describe("VdaDid tests", function() {
    this.beforeAll(async () => {
    })

    describe("Create", () => {
        it("Success", async () => {
            try {
                const doc = new DIDDocument(DID, DID_PK)
                doc.setAttributes({
                    created: doc.buildTimestamp(NOW)
                })
                doc.signProof(wallet.privateKey)
                masterDidDoc = doc

                const publishedEndpoints = await veridaApi.create(doc, ENDPOINTS)

                assert.ok(Object.keys(publishedEndpoints).length, 'At least one endpoint was published')
                assert.deepEqual(Object.keys(publishedEndpoints), ENDPOINTS, 'Succesfully published to all endpoints')
            } catch (err) {
                assert.fail(`Failed: ${err.message}`)
            }
        })

        it("Fail - Try to create a second time", async () => {
            try {
                const doc = new DIDDocument(DID, DID_PK)
                doc.setAttributes({
                    created: doc.buildTimestamp(NOW)
                })
                doc.signProof(wallet.privateKey)
                masterDidDoc = doc

                await veridaApi.create(doc, ENDPOINTS)

                assert.fail(`Document created, when it shouldn't`)
            } catch (err) {
                assert.equal(err.message, 'Unable to create DID: All endpoints failed to accept the DID Document')
                const errors = veridaApi.getLastEndpointErrors()
                assert.equal(errors![ENDPOINTS[0]].message, 'DID Document already exists. Use PUT request to update.')
            }
        })

        it("Success - One failed endpoint", async () => {
            try {
                const doc = new DIDDocument(DID2, DID_PK2)
                doc.setAttributes({
                    created: doc.buildTimestamp(NOW)
                })
                doc.signProof(DID_PRIVATE_KEY2)
                //masterDidDoc2 = doc

                const publishedEndpoints = await veridaApi2.create(doc, ENDPOINTS_FAIL)

                assert.ok(Object.keys(publishedEndpoints).length, 'At least one endpoint was published')
                assert.deepEqual(Object.keys(publishedEndpoints), ENDPOINTS_FAIL, 'Response for all endpoints')
                assert.equal(publishedEndpoints[ENDPOINTS_FAIL[1]].status, 'fail', 'Second endpoint failed')
            } catch (err) {
                assert.fail(`Failed: ${err.message}`)
            }
        })
    })

    describe("Get", () => {
        it("Success", async () => {
            try {
                const response = await didResolver.resolve(DID)
                const didDocument = <DIDDocument> response.didDocument

                assert.deepEqual(didDocument!.export(), masterDidDoc.export(), 'Returned DID Document matches created DID Document')
            } catch (err) {
                assert.fail(`Failed: ${err.message}`)
            }
        })
    })

    describe("Update", () => {
        it("Fail - Version not updated", async () => {
            try {
                const doc = new DIDDocument(masterDidDoc.export())
                doc.setAttributes({
                    updated: doc.buildTimestamp(LATER)
                })
                doc.signProof(wallet.privateKey)

                await veridaApi.update(doc)
                assert.fail(`Document updated, when it shouldn't`)
            } catch (err) {
                assert.equal(err.message, 'Unable to update DID: All endpoints failed to accept the DID Document', 'Unable to update DID Document')
                const errors = veridaApi.getLastEndpointErrors()
                assert.equal(errors![ENDPOINT].message, 'Invalid DID Document: Incorrect value for versionId (Expected 1)')
            }
        })

        it("Fail - Version not next", async () => {
            try {
                const doc = new DIDDocument(masterDidDoc.export())
                doc.setAttributes({
                    versionId: 3,
                    updated: doc.buildTimestamp(LATER)
                })
                doc.signProof(wallet.privateKey)

                await veridaApi.update(doc)
                assert.fail(`Document updated, when it shouldn't`)
            } catch (err) {
                assert.equal(err.message, 'Unable to update DID: All endpoints failed to accept the DID Document', 'Unable to update DID DOcument')
                const errors = veridaApi.getLastEndpointErrors()
                assert.equal(errors![ENDPOINT].message, 'Invalid DID Document: Incorrect value for versionId (Expected 1)')
            }
        })

        it("Fail - Updated timestamp is same as created", async () => {
            try {
                const doc = new DIDDocument(masterDidDoc.export())
                doc.setAttributes({
                    versionId: 1,
                    updated: doc.buildTimestamp(NOW),
                })
                doc.signProof(wallet.privateKey)

                await veridaApi.update(doc)
                assert.fail(`Document updated, when it shouldn't`)
            } catch (err) {
                assert.equal(err.message, 'Unable to update DID Document. "updated" timestamp matches "created" timestamp', 'Invalid updated timestamp')
            }
        })

        /*it("Fail - 1/n endpoints fail", async () => {
            try {
                const doc = new DIDDocument(DID, DID_PK)
                doc.signProof(wallet.privateKey)
                masterDidDoc = doc

                const publishedEndpoints = await veridaApi.update(doc)
                assert.fail(`Document updated, when it shouldn't`)
            } catch (err) {
                console.log(Object.keys(err.response))
                assert.equal(err.response.data.status, 'fail', 'Fail status')
                assert.equal(err.response.data.message, 'Unable to update DID: All endpoints failed to accept the DID Document', 'Invalid versionId')
                //assert.fail(`Failed: ${err.message}`)
            }
        })*/

        it("Success", async () => {
            const doc = new DIDDocument(masterDidDoc.export())
            doc.setAttributes({
                versionId: 1,
                updated: doc.buildTimestamp(LATER)
            })
            doc.signProof(wallet.privateKey)

            // Verify update response is correct
            const response = await veridaApi.update(doc)
            assert.ok(Object.keys(response).length > 0, 'Update successfully returned at least one response')
            assert.equal(response[ENDPOINTS[0].toLocaleLowerCase()].status, 'success', 'Success response')

            // Verify the new DID document is resolved
            const didResolve = await didResolver.resolve(DID)
            const resolvedDid = <DIDDocument> didResolve.didDocument
            assert.deepEqual(resolvedDid!.export(), doc.export(), 'Returned DID Document matches created DID Document')
        })
    })

    describe("Endpoint changes", () => {
        it("Fail - Add endpoint that is unavailable", async () => {
            try {
                const response = await veridaApi.addEndpoint(DID_ADDRESS, `http://localhost:9000/did/${DID}`)
                assert.fail('Should not have succeeded')
            } catch (err) {
                assert.ok(err.message, 'Failed: Unable to add endpoint. connect ECONNREFUSED 127.0.0.1:9000', 'Unable to connect to endpoint')
            }
        })

        // @todo Success
    })
})