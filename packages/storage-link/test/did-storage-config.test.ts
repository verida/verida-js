'use strict'
const assert = require('assert')

import { DIDStorageConfig } from '../src/index'
import { Utils } from '@verida/3id-utils-node'
import { AutoAccount } from '@verida/account'

// Test Ethereum Private key used to create / unlock a 3ID
const ETH_PRIVATE_KEY = '0xc0da48347b4bcb2cfb08d6b8c26b52b47fd36ca6114974a0104d15fab076f553'
const CERAMIC_URL = 'http://localhost:7007' // Note: Requires running ceramic locally

describe('DID Storage Config', () => {
    // Instantiate utils
    const utils = new Utils(CERAMIC_URL)

    describe('Generate a storage config', function() {
        this.timeout(20000)

        it('can link a DID to a secure storage context', async function() {
            const ceramic = await utils.createAccount('ethr', ETH_PRIVATE_KEY)
            const authenticator = new AutoAccount(ceramic)
            const config = await DIDStorageConfig.generate(authenticator, 'Test Context', {
                storageServer: {
                    type: 'VeridaCouchDb',
                    endpointUri: 'https://'
                },
                messageServer: {
                    type: 'VeridaCouchDb',
                    endpointUri: 'https://'
                }
            })

            assert.ok(config)
        })
    })
});
