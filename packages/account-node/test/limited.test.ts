'use strict'
const assert = require('assert')
import { LimitedAccount } from "../src/index"

const ETH_PRIVATE_KEY = '0xc0da48347b4bcb2cfb08d6b8c26b52b47fd36ca6114974a0104d15fab076f553'
const CERAMIC_URL = 'https://ceramic-clay.3boxlabs.com'
const DEFAULT_ENDPOINTS = {
    defaultDatabaseServer: {
        type: 'VeridaDatabase',
        endpointUri: 'https://db.testnet.verida.io:5002/'
    },
    defaultMessageServer: {
        type: 'VeridaMessage',
        endpointUri: 'https://db.testnet.verida.io:5002/'
    },
}

const VALID_CONTEXT = 'Verida Test: Valid Context'
const INVALID_CONTEXT = 'Verida Test: Invalid Context'


describe('Limited account tests', () => {

    describe('Basic tests', function() {
        this.timeout(100000)

        it('Won\'t fetch keyring for an unsupported context', async function() {
            const account = new LimitedAccount(DEFAULT_ENDPOINTS, {
                chain: 'ethr',
                privateKey: ETH_PRIVATE_KEY,
                ceramicUrl: CERAMIC_URL
            }, [VALID_CONTEXT])

            const validKeyring = await account.keyring(VALID_CONTEXT)
            assert.ok(validKeyring, "Have a valid keyring")

            const promise = new Promise((resolve, rejects) => {
                account.keyring(INVALID_CONTEXT).then(rejects, resolve)
            })
            const result = await promise

            assert.deepEqual(result, new Error(`Account does not support context: ${INVALID_CONTEXT}`))
        })

    })
})
