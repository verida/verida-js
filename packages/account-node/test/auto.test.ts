'use strict'
const assert = require('assert')
import { AutoAccount } from "../src/index"
import { decodeJWT } from 'did-jwt'
//import CONFIG from './config'
import { AccountNodeDIDClientConfig, EnvironmentType } from "@verida/types"
const MNEMONIC = 'next awake illegal system analyst border core forum wheat frost hen patch'

const APPLICATION_NAME = 'Verida Test: DIDJWT'

const DID_CLIENT_CONFIG: AccountNodeDIDClientConfig = {
    //privateKey: CONFIG.networkPrivateKey,
    callType: 'web3',
    web3Config: {},
    didEndpoints: []
}

describe('Auto account tests', () => {

    describe('Basic tests', function () {
        this.timeout(100000)

        it('verify did-jwt', async function () {
            const account = new AutoAccount({
                environment: EnvironmentType.TESTNET,
                privateKey: MNEMONIC,
                didClientConfig: DID_CLIENT_CONFIG
            })
            const didJwt = await account.createDidJwt(APPLICATION_NAME, {
                hello: 'world'
            })

            const decoded: any = decodeJWT(didJwt)
            const did = await account.did()

            assert.equal(decoded.payload.aud, did, 'Decoded AUD matches')
            assert.equal(decoded.payload.iss, did, 'Decoded ISS matches')
            assert.equal(decoded.payload.data.hello, 'world', 'Decoded data matches')
            assert.equal(decoded.payload.context, APPLICATION_NAME, 'Decoded context matches')
        })

        it('can reopen the same did account with the same mnemonic and did', async () => {
            const account1 = new AutoAccount({
                environment: EnvironmentType.TESTNET,
                privateKey: MNEMONIC,
                didClientConfig: DID_CLIENT_CONFIG
            })

            const did1 = await account1.did()

            const account2 = new AutoAccount({
                environment: EnvironmentType.TESTNET,
                privateKey: MNEMONIC,
                didClientConfig: DID_CLIENT_CONFIG
            })

            const did2 = await account2.did()
            assert.equal(did1, did2, 'both dids match')
        })

    })
})
