
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

        describe("Using Client to open public profiles", function () {
            const wrongContextName = "Context: Wrong Name";
            const wrongFallbackContextName = "Context: Wrong Name 2";

            it('can use fallbackContext="Verida: Vault" to open public profile', async () => {
                const profile = await client1.openPublicProfile(
                    did1,
                    wrongContextName
                );
                const name = await profile.get("name");

                assert.equal(name, DATA.name, "Can get a profile value");
            });

            it("can disable fallbackContext on open public profile", async () => {
                const profile = await client1.openPublicProfile(
                    did1,
                    CONFIG.CONTEXT_NAME,
                    "basicProfile",
                    null
                );
                const name = await profile.get("name");

                assert.equal(name, DATA.name, "Can get a profile value");
            });

            it("can not open a public profile using the wrong context and without fallbackContext", async () => {
                await assert.rejects(async () => {
                    await client1.openPublicProfile(
                        did1,
                        wrongContextName,
                        "basicProfile",
                        null
                    );
                }, {
                    message: `Account does not have a public profile for ${wrongContextName}`
                })
            });

            it("can not open a public profile using both the wrong context and wrong fallbackContext", async () => {
                await assert.rejects(async () => {
                    await client1.openPublicProfile(
                        did1,
                        wrongContextName,
                        "basicProfile",
                        wrongFallbackContextName
                    );
                }, {
                    message: `Account does not have a public profile for ${wrongFallbackContextName}`
                })
            });
        });
    })

    // @todo: add tests for private profiles
})