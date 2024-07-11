'use strict'
const assert = require('assert')

import { AutoAccount } from '@verida/account-node'
import { Client } from '../src/index'
import { Network } from '@verida/types'
import CONFIG from './config'

const NETWORK = Network.DEVNET

/**
 * Test a single (or collection) of storage nodes
 */
describe('Storage context hash tests', () => {
    let didClient, contextByName, contextByHash

    const client = new Client({
        network: NETWORK,
        didClientConfig: {
            network: NETWORK
        },
        //readOnlyDataApiUri: 'https://data.verida.network'
        //readOnlyDataApiUri: 'http://localhost:8182'
    })

    describe('Test get profile', function() {
        this.timeout(200 * 1000)

        let did
        const contextName = 'Verida: Vault'
        const profileName = 'basicProfile'

        it(`can create a profile`, async () => {
            const account = new AutoAccount({
                privateKey: CONFIG.VDA_PRIVATE_KEY,
                network: CONFIG.NETWORK,
                didClientConfig: CONFIG.DID_CLIENT_CONFIG
            })
            did = await account.did()
            await client.connect(account)
            const context = await client.openContext('Verida: Vault', true)

            const profile = await context!.openProfile()
            await profile!.set("name", 'Test name')
            await profile!.set("country", 'Australia')

            await context.close({
                clearLocal: true
            })
        })

        it(`can get a known profile`, async function() {
            const profile = await client.getPublicProfile(did, contextName, profileName)
            assert.ok(profile, 'Profile returned')
            assert.ok(profile.country, 'Profile has a country')
            assert.equal(profile._id, 'basicProfile', 'Profile ')
        })

        it(`can get a known profile, using fallback`, async function() {
            const profile = await client.getPublicProfile(did, 'Invalid Context', profileName)
            assert.ok(profile, 'Profile returned')
            assert.ok(profile.country, 'Profile has a country')
            assert.equal(profile._id, 'basicProfile', 'Profile ')
        })

        it(`can't get a non-existent profile`, async function() {
            try {
                const profile = await client.getPublicProfile('did:vda:testnet:0xaaa2351168D370b174E0fD3Feec93C4E6d2938e2', contextName, profileName)
                assert.fail(`Profile returned when it shouldn't`)
            } catch (err) {
                assert.equal(err.message, 'Account (did:vda:testnet:0xaaa2351168D370b174E0fD3Feec93C4E6d2938e2) does not have a public profile for Verida: Vault', 'Correct error message')
            }
        })

        it(`can handle an invalid server URI`, async function() {
            const client2 = new Client({
                network: NETWORK,
                didClientConfig: {
                    network: NETWORK,
                },
                readOnlyDataApiUri: 'https://www.google.com'
            })

            // Despite the invalid URI, the SDK will fallback to using the protocol
            const profile = await client2.getPublicProfile(did, contextName, profileName)
            assert.ok(profile, 'Profile returned')
            assert.ok(profile.country, 'Profile has a country')
            assert.equal(profile._id, 'basicProfile', 'Profile ')
        })
    })
})