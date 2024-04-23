'use strict'
const assert = require('assert')
import { DIDClient } from '@verida/did-client'
import { BlockchainAnchor } from '@verida/types'
const util = require('util')

let didClient

const DID = 'did:vda:banksia:0xB0BF030a742233448428590bf6A590C1E1582b4C'.toLowerCase()

/**
 * 
 */
describe('DID GET document tests', () => {

    before(async () => {
        didClient = new DIDClient({
            blockchain: BlockchainAnchor.POLAMOY
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
