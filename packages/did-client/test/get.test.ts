'use strict'
const assert = require('assert')
import { DIDClient } from '@verida/did-client'
import { BlockchainAnchor } from '@verida/types'
const util = require('util')

let didClient

const DID = 'did:vda:polamoy:0x60e32de832d22ce242dbe0c64ffdc079f86c2b1f'.toLowerCase()

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
