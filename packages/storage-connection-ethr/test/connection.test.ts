'use strict'
const assert = require('assert')

import { StorageConnectionEthr } from '../src/index'
import { StorageIndex } from '@verida/storage/src/interfaces'

describe('Connection', () => {
    let privateKey = '0xeb12166759cafed2bc9b996b09304dbe985fd82f370def5566c26be382f45456'
    let connection = new StorageConnectionEthr({ privateKey })
    let address = connection.getAddress()
    let did = `did:ethr:${address}`

    describe('signing', function() {
        it('can sign, verify and recover', async function() {
            const message = 'hello world'
            const signedMessage = await connection.sign(message)
    
            const verified = connection.verify(did, message, signedMessage)
            assert(verified, true, 'confirm message signed by did')

            const signingDid = connection.recoverDid(message, signedMessage)
            assert(signingDid, did, 'fetched correct signing DID')
        });
    })

    describe('did management', function() {
        it('can link storage connectiono', async function() {
            const storageIndex = await connection.link(did, {
                name: 'MyCompany: MyApplication Name',
                serverUri: 'https://db.testnet.verida.io:5001/',
                applicationUri: 'https://myapp.com/'
            })

            assert(storageIndex.name == 'MyCompany: MyApplication Name', true, 'Have a StorageIndex returned')
        })

        it('can get storage connection index', async function() {
            const storageIndex = await connection.get(did, 'MyCompany: MyApplication Name')

            let publicKeys = {
                'asym': '7RhDryK3C8PQG7iuBWpg4wqjJGC2Hggp5mgawqkGcmkR',
                'sign': '9ccwKSuowo16eLY1DbHgTTZCjC6dReeMKdTYEUiJQUXp'
            }

            assert.ok(storageIndex, 'Storage index returned')
            assert(storageIndex.signPublicKey, publicKeys.sign, 'Correct signing key')
            assert(storageIndex.asymPublicKey, publicKeys.asym, 'Correct asym key')
        })

        it('can update did with multiple applications', async function() {
            const storageIndex = await connection.link(did, {
                name: 'MyCompany: Application2',
                serverUri: 'https://db.testnet.verida.io:5001/',
                applicationUri: 'https://myapp2.com/'
            })

            assert(storageIndex.name == 'MyCompany: Application2', true, 'Have a StorageIndex returned for second application')

            let storageIndexApp1 = await connection.get(did, 'MyCompany: MyApplication Name')
            let storageIndexApp2 = await connection.get(did, 'MyCompany: Application2')

            assert.ok(storageIndex, 'Storage index returned')
            assert.equal(storageIndexApp1.name, 'MyCompany: MyApplication Name')
            assert.equal(storageIndexApp2.name, 'MyCompany: Application2')
        })
    })
});
