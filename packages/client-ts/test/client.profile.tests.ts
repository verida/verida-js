

'use strict'
const assert = require('assert')

import { Client } from '../src/index'
import { AutoAccount } from '@verida/account-node'
import { StorageLink } from '@verida/storage-link'
import { DIDDocument } from '@verida/did-document'
import CONFIG from './config'
import { EnvironmentType, IDatabase } from '@verida/types'
import { isAssertionExpression } from 'typescript'

const ENVIRONMENT = EnvironmentType.TESTNET

/**
 * Test a single (or collection) of storage nodes
 */
describe('Storage context hash tests', () => {
    let didClient, contextByName, contextByHash

    const client = new Client({
        environment: ENVIRONMENT,
        didClientConfig: {
            network: ENVIRONMENT,
        },
        //readOnlyDataApiUri: 'https://data.verida.network'
        //readOnlyDataApiUri: 'http://localhost:8182'
    })

    describe('Test get profile', function() {
        this.timeout(200 * 1000)

        const did = 'did:vda:testnet:0xb362351168D370b174E0fD3Feec93C4E6d2938e2'
        const contextName = 'Verida: Vault'
        const profileName = 'basicProfile'

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
                environment: ENVIRONMENT,
                didClientConfig: {
                    network: ENVIRONMENT,
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