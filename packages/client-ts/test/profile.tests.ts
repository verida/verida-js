const assert = require('assert')

import { Client } from '../src/index'
import { AutoAccount } from '@verida/account-node'
import CONFIG from './config'
import { sleep } from './utils'
const util = require('util')

const DATA = {
    name: "Jane"
}

describe('Profile tests', () => {
    const client1 = new Client({
        environment: CONFIG.ENVIRONMENT,
        didClientConfig: CONFIG.DID_CLIENT_CONFIG
    })
    let did1, context1, profile1

    const client2 = new Client({
        environment: CONFIG.ENVIRONMENT
    })
    let did2, context2, profile2
    let vaultContext

    describe("Public profiles", function() {
        this.timeout(120 * 1000)

        it('can initialise own profile', async () => {
            try {
                const account1 = new AutoAccount({
                    privateKey: CONFIG.VDA_PRIVATE_KEY,
                    environment: CONFIG.ENVIRONMENT,
                    didClientConfig: CONFIG.DID_CLIENT_CONFIG
                })
                did1 = await account1.did()
                await client1.connect(account1)
                context1 = await client1.openContext(CONFIG.CONTEXT_NAME, true)

                profile1 = await context1.openProfile()
                await profile1.set("name", DATA.name)
                const name = await profile1.get("name")
                assert.equal(name, DATA.name, "Can set and get a profile value")

                /*const db = await profile1.store.getDb()
                const info = await db.info()
                console.log(info)

                const contextInfo = await context1.info()
                console.log(util.inspect(contextInfo, {showHidden: false, depth: null, colors: true}))*/

                // Also set a name on the `Verida: Vault` profile to be fetched in a future test
                vaultContext = await client1.openContext('Verida: Vault', true)
                const vaultProfile = await vaultContext!.openProfile()
                await vaultProfile!.set("name", 'Vault Test Name')
            } catch (err) {
                console.log(err.response.data)
            }
        })

        it('can not set invalid profile values', async () => {
            await context1.close()
            context1 = await client1.openContext(CONFIG.CONTEXT_NAME, true)

            profile1 = await context1.openProfile()
            const response = await profile1.set("name", "")
            assert.equal(response, false, "Can not set an invalid profile value")
        })

        it('can access an external profile', async () => {
            await sleep(5000)
            const account2 = new AutoAccount({
                privateKey: CONFIG.VDA_PRIVATE_KEY_2,
                environment: CONFIG.ENVIRONMENT,
                didClientConfig: CONFIG.DID_CLIENT_CONFIG
            })
            did2 = await account2.did()
            await client2.connect(account2)
            context2 = await client2.openContext(CONFIG.CONTEXT_NAME, true)

            profile2 = await context2.openProfile(undefined, did1, false)
            const name = await profile2.get("name")
            assert.equal(name, DATA.name, "Can get external public profile data")
        })
    })

    describe("Using Client to open public profiles", function () {
        this.timeout(60 * 1000)
        const wrongContextName = "Context: Wrong Name";
        const wrongFallbackContextName = "Context: Wrong Name 2";

        it('can use fallbackContext="Verida: Vault" to open public profile', async () => {
            const profile = await client1.openPublicProfile(
                did1,
                wrongContextName
            );
            const name = await profile!.get("name");

            assert.equal(name, 'Vault Test Name', "Can get a profile value");
        });

        it("can disable fallbackContext on open public profile", async () => {
            const profile = await client1.openPublicProfile(
                did1,
                CONFIG.CONTEXT_NAME,
                "basicProfile",
                null
            );
            const name = await profile!.get("name");

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
                message: `Account (${did1}) does not have a public profile for ${wrongContextName}`
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
                message: `Account (${did1}) does not have a public profile for ${wrongFallbackContextName}`
            })
        });
    });

    after(async () => {
        await context1.close({
            clearLocal: true
        })
        await context2.close({
            clearLocal: true
        })
        await vaultContext.close({
            clearLocal: true
        })
    })

    // @todo: add tests for private profiles
})