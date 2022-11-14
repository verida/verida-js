const assert = require('assert')
import { ethers } from 'ethers'
import { DIDDocument } from '@verida/did-document'
import { getResolver } from '../src/resolver'
import { Resolver } from 'did-resolver'
import { VdaDid } from '@verida/vda-did'

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

let masterDidDoc, didResolver

describe("SDK tests", function() {
    this.beforeAll(async () => {
        // @todo: create the DID
        const vdaDidResolver = getResolver()
        didResolver = new Resolver(vdaDidResolver)
    })

    describe("Get", () => {
        it("Success", async () => {
            try {
                const didDocument = await didResolver.resolve(DID)

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