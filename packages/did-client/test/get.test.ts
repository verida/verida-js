'use strict'
const assert = require('assert')
import { DIDClient } from '@verida/did-client'
const util = require('util')
require('dotenv').config()

const rpcUrl = process.env[`RPC_URL`]
if (rpcUrl === undefined) {
    throw new Error('RPC url is not defined in env')
}

let didClient

const DID = 'did:vda:testnet:0xacC4adBe7d820266CBB6202F178e539B2814fe9c'.toLowerCase()

/**
 * 
 */
describe('DID GET document tests', () => {

    before(async () => {
        didClient = new DIDClient({
            network: 'testnet',
            rpcUrl
        })
    })

    describe('Document get', function() {
        it('can fetch an existing document', async function() {
            const doc = await didClient.get(DID)
            assert.ok(doc)
            assert.equal(doc.id, DID, 'Retreived document has matching DID')
            console.log(util.inspect(doc, {depth: 4}))
        })
    })

})
