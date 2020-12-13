'use strict'
const assert = require('assert')

import { StorageConnectionEthr } from '../src/index'

describe('Connection', () => {
    let privateKey = '0xeb12166759cafed2bc9b996b09304dbe985fd82f370def5566c26be382f45456'
    let connection = new StorageConnectionEthr({ privateKey })
    let address = connection.getAddress()
    let did = `did:ethr:${address}`

    describe('signing', function() {
        it('can sign', async function() {
            const message = 'hello world'
            const signedMessage = await connection.sign(message)
    
            const verified = connection.verify(did, message, signedMessage)
            assert(verified, true, 'confirm message signed by did')

            const signingDid = StorageConnectionEthr.recoverDid(message, signedMessage)
            assert(signingDid, did, 'fetched correct signing DID')
        });
    })
});
