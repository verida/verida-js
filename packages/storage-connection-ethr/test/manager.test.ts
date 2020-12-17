// @todo: test store-manager addProvider, getStorage, getStorageExternal
'use strict'
const assert = require('assert')
import { StorageConnectionEthr } from '../src/index'
import { Manager } from '@verida/storage'

describe('Manager', () => {
    let privateKey = '0xeb12166759cafed2bc9b996b09304dbe985fd82f370def5566c26be382f45456'
    let connection = new StorageConnectionEthr({ privateKey })
    let address = connection.getAddress()
    let did = `did:ethr:${address}`

    describe('Open storage', function() {
        const manager = new Manager([connection], 'https://db.testnet.verida.io:5001/', 'https://managerapp.com/')

        /*
        @todo: support unlinking so we can cleanup
        it('fails to open storage that doesnt exist', async function() {
            const storage = await manager.openStorage(did, 'Manager App2', false)
            assert(storage == null, 'storage not found')
        })*/

        it('forces open storage that doesnt exist', async function() {
            const storage = await manager.openStorage(did, 'Manager App', true)
            assert.ok(storage != null, 'storage created found')
            assert.equal(storage.did, did, 'storage DID matches expected DID')
            assert.equal(storage.storageIndex.serverUri, 'https://db.testnet.verida.io:5001/', 'storage index serverUri matches expected value')
            assert.equal(storage.storageIndex.applicationUri, 'https://managerapp.com/', 'storage index applicationUri matches expected value')
            assert.ok(storage.keyring, 'storage has a keyring')
        })
    })

    describe('Open external storage', function() {
        const manager = new Manager([connection], 'https://db.testnet.verida.io:5001/', 'https://managerapp.com/')

        /*
        @todo: support unlinking so we can cleanup
        it('fails to open storage that doesnt exist', async function() {
            const storage = await manager.openStorage(did, 'Manager App2', false)
            console.log(storage)
            assert(storage == null, 'storage not found')
        })*/

        it('cant open storage that doesnt exist', async function() {
            const storage = await manager.openStorageExternal('did:ethr:0xeB8Df5734AeFD6eE43b0649b1f7bffff9ff8FA99', 'Manager App')
            assert(storage == null, 'storage not found')
        })

        it('can open storage that exists', async function() {
            const storage = await manager.openStorageExternal(did, 'Manager App')
            assert.ok(storage != null, 'storage found')
            assert.equal(storage.did, did, 'storage DID matches expected DID')
            assert.equal(storage.storageIndex.serverUri, 'https://db.testnet.verida.io:5001/', 'storage index serverUri matches expected value')
            assert.equal(storage.storageIndex.applicationUri, 'https://managerapp.com/', 'storage index applicationUri matches expected value')
            assert.ok(!storage.keyring, 'storage doesnt have a keyring')
        })
    })
})