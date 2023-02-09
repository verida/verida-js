const assert = require('assert')
require('dotenv').config();
import { ethers } from 'ethers'
import { DIDDocument } from '@verida/did-document'
import { getResolver } from '../src/resolver'
import { Resolver } from 'did-resolver'
import { VdaDid } from '@verida/vda-did'
import { getBlockchainAPIConfiguration } from "./utils"
import { VeridaDocInterface } from '@verida/types';

const wallet = ethers.Wallet.createRandom()

let DID_ADDRESS, DID, DID_PK, DID_PRIVATE_KEY

DID_ADDRESS = wallet.address
DID = `did:vda:testnet:${DID_ADDRESS}`
DID_PK = wallet.publicKey
DID_PRIVATE_KEY = wallet.privateKey

const ENDPOINTS = [
    `https://node1-apse2.devnet.verida.tech/did/${DID}`,
    `https://node2-apse2.devnet.verida.tech/did/${DID}`,
    `https://node3-apse2.devnet.verida.tech/did/${DID}`
]

const baseConfig = getBlockchainAPIConfiguration()

const VDA_DID_CONFIG = {
    identifier: DID,
    signKey: DID_PRIVATE_KEY,
    callType: baseConfig.callType,
    web3Options: baseConfig.web3Options
}

// build resolver
const vdaDidResolver = getResolver()
const didResolver = new Resolver(vdaDidResolver)

let veridaApi = new VdaDid(VDA_DID_CONFIG)

let masterDidDoc

describe("DID Resolver Tests", function() {
    this.timeout(20000)
    this.beforeAll(async () => {
        // Create the test DID
        const doc = new DIDDocument(DID, DID_PK)
        doc.signProof(wallet.privateKey)
        masterDidDoc = doc

        const publishedEndpoints = await veridaApi.create(doc, ENDPOINTS)

        assert.ok(typeof(publishedEndpoints) == 'object' && Object.keys(publishedEndpoints).length > 0, 'At least one endpoint was accessed')
        for (let i in publishedEndpoints) {
            const endpoint = publishedEndpoints[i]
            assert.equal(endpoint.status, 'success', `${endpoint} success`)
        }
    })

    describe("Get", () => {
        this.timeout(20000)
        it("Success", async () => {
            try {
                const response = await didResolver.resolve(DID)
                const didDocument = new DIDDocument(<VeridaDocInterface> response.didDocument)

                assert.deepEqual(didDocument.export(), masterDidDoc.export(), 'Returned DID Document matches created DID Document')
            } catch (err) {
                assert.fail(`Failed: ${err.message}`)
            }
        })

        it("Fail - Invalid DID", async () => {
            try {
                await didResolver.resolve(`did:vda:0xabcdefg`)
                assert.fail(`Invalid DID was found`)
            } catch (err) {
                assert.ok(err.message.match('invalid address'), 'DID not found')
            }
        })
    })

    this.beforeAll(async () => {
        // @todo: delete the DID
    })
})