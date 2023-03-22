'use strict'
const assert = require('assert')
import { DIDClient } from '@verida/did-client'
import { EnvironmentType } from '@verida/types'
const util = require('util')

let didClient

const DID = 'did:vda:testnet:0x3aEAEde1a43B51774C9250a5F9C167Dd7ec74bcA'.toLowerCase()

/**
 * 
 */
describe('DID GET document tests', () => {

    before(async () => {
        didClient = new DIDClient({
            network: EnvironmentType.TESTNET
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
