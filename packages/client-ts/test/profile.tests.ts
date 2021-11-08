
'use strict'
const assert = require('assert')

import { Client } from '../src/index'
import { AutoAccount } from '@verida/account-node'
import CONFIG from './config'

const DATA = {
    name: "Jane"
}

describe('Profile tests', () => {
    const client1 = new Client({
        didServerUrl: CONFIG.DID_SERVER_URL,
        environment: CONFIG.ENVIRONMENT
    })
    let did1, context1, profile1

    const client2 = new Client({
        didServerUrl: CONFIG.DID_SERVER_URL,
        environment: CONFIG.ENVIRONMENT
    })
    let did2, context2, profile2

    describe("Public profiles", function() {
        this.timeout(100 * 1000)

        it('can initialise own profile', async () => {
            const account1 = new AutoAccount(CONFIG.DEFAULT_ENDPOINTS, {
                privateKey: CONFIG.VDA_PRIVATE_KEY,
                environment: CONFIG.ENVIRONMENT,
                didServerUrl: CONFIG.DID_SERVER_URL
            })
            did1 = await account1.did()
            await client1.connect(account1)
            context1 = await client1.openContext(CONFIG.CONTEXT_NAME, true)

            profile1 = await context1.openProfile()
            await profile1.set("name", DATA.name)
            const name = await profile1.get("name")
            assert.equal(name, DATA.name, "Can set and get a profile value")
        })

        it('can not set invalid profile values', async () => {
            context1 = await client1.openContext(CONFIG.CONTEXT_NAME, true)

            profile1 = await context1.openProfile()
            const response = await profile1.set("name", "")
            assert.equal(response, false, "Can not set an invalid profile value")
        })

        it('can access an external profile', async () => {
            const account2 = new AutoAccount(CONFIG.DEFAULT_ENDPOINTS, {
                privateKey: CONFIG.VDA_PRIVATE_KEY_2,
                environment: CONFIG.ENVIRONMENT,
                didServerUrl: CONFIG.DID_SERVER_URL
            })
            did2 = await account2.did()
            await client2.connect(account2)
            context2 = await client2.openContext(CONFIG.CONTEXT_NAME, true)

            profile2 = await context2.openProfile(undefined, did1, false)
            const name = await profile2.get("name")
            assert.equal(name, DATA.name, "Can get external public profile data")
        })
    })

    // @todo: add tests for private profiles
})