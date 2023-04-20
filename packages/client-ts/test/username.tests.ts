'use strict'
const assert = require('assert')

import { Client } from '../src/index'
import { AutoAccount } from '@verida/account-node'
import { VeridaNameClient } from '@verida/vda-name-client'
import CONFIG from './config'
import { EnvironmentType } from '@verida/types'

/**
 * 
 */
describe('Username lookup tests', () => {
    let didClient, context, USERNAME, DID

    const client = new Client({
        environment: CONFIG.ENVIRONMENT,
        didClientConfig: {
            network: EnvironmentType.TESTNET,
            rpcUrl: CONFIG.DID_CLIENT_CONFIG.rpcUrl
        }
    })

    const account = new AutoAccount({
        privateKey: CONFIG.VDA_PRIVATE_KEY,
        environment: CONFIG.ENVIRONMENT,
        didClientConfig: CONFIG.DID_CLIENT_CONFIG
    })

    describe('Verify username lookups work', function() {
        this.timeout(200 * 1000)

        this.beforeAll(async () => {
            await client.connect(account)
            DID = await account.did()

            // Make a 32 character username
            USERNAME = `${DID.substring(26)}.vda`

            // register a username if none exists
            try {
                const response = await client.parseDid(USERNAME)
            } catch (err) {
                // username not found, need to create
                const DID_PRIVATE_KEY = CONFIG.VDA_PRIVATE_KEY
                const POLYGON_PRIVATE_KEY = CONFIG.DID_CLIENT_CONFIG.web3Config.privateKey
                const RPC_URL = 'https://rpc-mumbai.maticvigil.com'

                // Create name Client
                const nameClient = new VeridaNameClient({
                    callType: 'web3',
                    did: DID,
                    signKey: DID_PRIVATE_KEY,
                    network: EnvironmentType.TESTNET,
                    web3Options: {
                        privateKey: POLYGON_PRIVATE_KEY,
                        rpcUrl: RPC_URL
                    }
                })

                await nameClient.register(USERNAME)
            }
        })

        it(`can use DID when opening an external context from a username`, async () => {
            try {
                await client.openExternalContext('Test context', USERNAME)
            } catch (err) {
                assert.ok(err.message.match(DID))
            }
        })

        it(`can use DID when getting context config`, async () => {
            try {
                await client.getContextConfig(USERNAME, 'Test context')
            } catch (err) {
                assert.ok(err.message.match(DID))
            }
        })

        it(`can use DID when opening an external profile`, async () => {
            try {
                await client.openPublicProfile(USERNAME, 'Test context')
            } catch (err) {
                assert.ok(err.message.match(DID))
            }
        })

        it(`can get a DID from a username`, async () => {
            const did = await client.getDID(USERNAME)
            assert.equal(did, DID, 'Fetched DID matches expected DID')
        })

        it(`can get usernames linked to a DID`, async () => {
            const usernames = await client.getUsernames(DID)
            assert.deepEqual(usernames, [USERNAME.toLowerCase()], 'Fetched usernames matches expected array')
        })

    })
})