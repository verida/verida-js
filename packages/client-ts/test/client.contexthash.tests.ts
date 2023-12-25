const assert = require('assert')

import { Client } from '../src/index'
import { AutoAccount } from '@verida/account-node'
import { StorageLink } from '@verida/storage-link'
import { DIDDocument } from '@verida/did-document'
import CONFIG from './config'
import { EnvironmentType, IDatabase } from '@verida/types'

const CONTEXT_NAME = 'Verida Storage Node Test: Test Application 1'

const PRIVATE_KEY = ''
const ENVIRONMENT = EnvironmentType.TESTNET

let client, account, did

/**
 * Test a single (or collection) of storage nodes
 */
describe('Storage context hash tests', function() {

    this.beforeAll(async function() {
        client = new Client({
            environment: ENVIRONMENT,
            didClientConfig: {
                network: ENVIRONMENT,
            }
        })
        
        account = new AutoAccount({
            privateKey: PRIVATE_KEY,
            environment: ENVIRONMENT,
            didClientConfig: CONFIG.DID_CLIENT_CONFIG
        })

        await client.connect(account)
        did = await account.did()
    })

    describe.skip('Perform tests', () =>{

        it('can fetch correct context name', async function () {
            const contextHash = DIDDocument.generateContextHash(did, CONTEXT_NAME);
            const contextName = await client.getContextNameFromHash(contextHash)
            assert.equal(contextName, CONTEXT_NAME, 'Context name matches expected value')
        })

        it(`can't fetch incorrect context name`, async function () {
            const contextHash = '0xinvalidvalue';

            try {
                await client.getContextNameFromHash(contextHash)
                assert.fail('Should have failed')
            } catch (err) {
                assert.equal(err.message, `Unable to locate service associated with context hash ${contextHash}`)
            }
        })
    })
})