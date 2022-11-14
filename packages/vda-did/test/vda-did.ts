const assert = require('assert')
import { ethers } from 'ethers'
import { DIDDocument } from '@verida/did-document'
import { CallType } from '@verida/web3'
import { getResolver } from '@verida/vda-did-resolver'
import { Resolver } from 'did-resolver'

import VdaDid from '../src/vdaDid'

const wallet = ethers.Wallet.createRandom()

let DID_ADDRESS, DID, DID_PK, DID_PRIVATE_KEY

DID_ADDRESS = wallet.address
DID = `did:vda:testnet:${DID_ADDRESS}`
DID_PK = wallet.publicKey
DID_PRIVATE_KEY = wallet.privateKey

const vdaDidResolver = getResolver()
const didResolver = new Resolver(vdaDidResolver)

const VDA_DID_CONFIG = {
    identifier: DID,
    vdaKey: DID_PRIVATE_KEY,
    callType: <CallType> 'web3',
    web3Options: {}
}

const ENDPOINTS = [`http://localhost:5000/did/${DID}`]
let veridaApi = new VdaDid(VDA_DID_CONFIG)

let masterDidDoc

describe("VdaDid tests", function() {
    this.beforeAll(async () => {
    })

    describe("Create", () => {
        it("Success", async () => {
            try {
                const doc = new DIDDocument(DID, DID_PK)
                doc.signProof(wallet.privateKey)
                masterDidDoc = doc

                const publishedEndpoints = await veridaApi.create(doc, ENDPOINTS)

                assert.ok(Object.keys(publishedEndpoints).length, 'At least one endpoint was published')
                assert.deepEqual(Object.keys(publishedEndpoints), ENDPOINTS, 'Succesfully published to all endpoints')
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
        it("Fail - Incorrect version", async () => {
            try {
                const doc = new DIDDocument(masterDidDoc.export())
                doc.signProof(wallet.privateKey)

                await veridaApi.update(doc)
                assert.fail(`Document updated, when it shouldn't`)
            } catch (err) {
                assert.equal(err.message, 'Unable to update DID: All endpoints failed to accept the DID Document', 'Invalid versionId')
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
            try {
                const doc = new DIDDocument(masterDidDoc.export())
                doc.setAttributes({
                    versionId: 1
                })
                doc.signProof(wallet.privateKey)

                const response = await veridaApi.update(doc)
                assert.ok(Object.keys(response).length > 0, 'Update successfully returned at least one response')

                assert.equal(response[ENDPOINTS[0].toLocaleLowerCase()].status, 'success', 'Success response')
            } catch (err) {
                console.log(err)
                console.log(veridaApi.getLastEndpointErrors())
                assert.fail(`Failed: ${err.message}`)
            }
        })
    })
})