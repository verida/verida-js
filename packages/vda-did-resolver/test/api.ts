const assert = require('assert')
import { ethers } from 'ethers'
import { DIDDocument } from '@verida/did-document'

import API from '../src/api'

const wallet = ethers.Wallet.createRandom()

let DID_ADDRESS, DID, DID_PK, DID_PRIVATE_KEY

DID_ADDRESS = wallet.address
DID = `did:vda:testnet:${DID_ADDRESS}`
DID_PK = wallet.publicKey
DID_PRIVATE_KEY = wallet.privateKey

const ENDPOINTS = [`http://localhost:5000/did/${DID}`]
let veridaApi = new API({
    privateKey: DID_PRIVATE_KEY
})

let masterDidDoc

describe("SDK tests", function() {
    this.beforeAll(async () => {
    })

    describe("Create", () => {
        it("Success", async () => {
            try {
                const doc = new DIDDocument(DID, DID_PK)
                doc.signProof(wallet.privateKey)
                masterDidDoc = doc

                const publishedEndpoints = await veridaApi.create(doc, ENDPOINTS)

                assert.ok(publishedEndpoints.length, 'At least one endpoint was published')
                assert.deepEqual(publishedEndpoints, ENDPOINTS, 'Succesfully published to all endpoints')
            } catch (err) {
                assert.fail(`Failed: ${err.message}`)
            }
        })
    })

    describe("Get", () => {
        it("Success", async () => {
            try {
                const didDocument = await veridaApi.resolve({
                    id: DID,
                    did: DID,
                    didUrl: DID,
                    method: 'vda'
                })

                assert.deepEqual(didDocument.export(), masterDidDoc.export(), 'Returned DID Document matches created DID Document')
            } catch (err) {
                assert.fail(`Failed: ${err.message}`)
            }
        })
    })
})