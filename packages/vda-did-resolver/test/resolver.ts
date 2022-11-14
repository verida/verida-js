const assert = require('assert')
import { ethers } from 'ethers'
import { DIDDocument } from '@verida/did-document'
import { getResolver } from '../src/resolver'
import { Resolver } from 'did-resolver'
import { VdaDid } from '@verida/vda-did'
import { CallType } from '@verida/web3'

const wallet = ethers.Wallet.createRandom()

let DID_ADDRESS, DID, DID_PK, DID_PRIVATE_KEY

DID_ADDRESS = wallet.address
DID = `did:vda:testnet:${DID_ADDRESS}`
DID_PK = wallet.publicKey
DID_PRIVATE_KEY = wallet.privateKey

const ENDPOINTS = [`http://localhost:5000/did/${DID}`]

const VDA_DID_CONFIG = {
    identifier: DID,
    vdaKey: DID_PRIVATE_KEY,
    callType: <CallType> 'web3',
    web3Options: {}
}

// build resolver
const vdaDidResolver = getResolver()
const didResolver = new Resolver(vdaDidResolver)

let veridaApi = new VdaDid(VDA_DID_CONFIG)

let masterDidDoc

describe("SDK tests", function() {
    this.beforeAll(async () => {
        // Create the test DID
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

    describe("Get", () => {
        it("Success", async () => {
            try {
                const response = await didResolver.resolve(DID)
                const didDocument = response.didDocument

                assert.deepEqual(didDocument.export(), masterDidDoc.export(), 'Returned DID Document matches created DID Document')
            } catch (err) {
                assert.fail(`Failed: ${err.message}`)
            }
        })
    })

    this.beforeAll(async () => {
        // @todo: delete the DID
    })
})