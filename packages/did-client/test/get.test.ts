'use strict'
const assert = require('assert')
import { DIDClient } from '@verida/did-client'
const util = require('util')

let didClient

const DID = 'did:vda:testnet:0x09315952c531092c291516c8c0956c3082d33807'

/**
 * 
 */
describe('DID GET document tests', () => {

    before(async () => {
        didClient = new DIDClient({
            network: 'testnet'
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
