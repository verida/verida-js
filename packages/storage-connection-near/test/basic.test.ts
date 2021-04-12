'use strict'
const assert = require('assert')
const nearApi = require('near-api-js')

const networkId = 'testnet'
const masterAccount = 'dev-storage-connection-near-verida.testnet'
const secretKey = 'ed25519:47rTjZVyXziLgzN7qdFz5NmjSSapfoftRSCqKxguJLnonteUnxPLhE5CKuhvKqRv7979knPkQg6pPiADZvfPyeXH'
const keyPair = nearApi.utils.KeyPair.fromString(secretKey)

function generateUniqueString(prefix) {
    return `${prefix}-${Date.now()}-${Math.round(Math.random() * 1000000)}`;
}

async function getConnection() {
    const keyStore = new nearApi.keyStores.InMemoryKeyStore()
    const config = {
        nodeUrl: 'https://rpc.testnet.near.org',
        networkId,
        masterAccount,
        deps: {
            keyStore
        }
    };

    await keyStore.setKey(networkId, masterAccount, keyPair)
    return nearApi.connect(config)
}

describe('Connection', () => {

    describe('Blockchain', function() {
        it('can connect', async function() {
            const near = await getConnection()
            assert.ok(near, 'hello world')
        });

        it('can create account', async function() {
            const near = await getConnection()
            const newAccountName = generateUniqueString('test')
            console.log('newAccountName', newAccountName)
            const newPublicKey = await near.connection.signer.createKey(newAccountName, networkId)

            console.log('newPublicKey', newPublicKey)
            await near.createAccount(newAccountName, newPublicKey)
            const account = new nearApi.Account(near.connection, newAccountName)
            console.log('account', account)
            return account;
        })
    })
});
