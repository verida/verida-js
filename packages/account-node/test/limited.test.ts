const assert = require('assert')
import { LimitedAccount } from "../src/index"
import { DIDClient } from "@verida/did-client"
import { AccountNodeDIDClientConfig, EnvironmentType } from "@verida/types"
require('dotenv').config()

const MNEMONIC = 'next awake illegal system analyst border core forum wheat frost hen patch'

const DID_CLIENT_CONFIG: AccountNodeDIDClientConfig = {
    //privateKey: CONFIG.networkPrivateKey,
    callType: 'web3',
    web3Config: {},
    didEndpoints: []
}

const didClient = new DIDClient({
    network: EnvironmentType.TESTNET
})
didClient.authenticate(MNEMONIC, 'web3', {
    privateKey: process.env.PRIVATE_KEY,
    rpcUrl: process.env.RPC_URL
}, [])
const DID = didClient.getDid()

const VALID_CONTEXT = 'Verida Test: Valid Context'
const INVALID_CONTEXT = 'Verida Test: Invalid Context'


describe('Limited account tests', () => {

    describe('Basic tests', function() {
        this.timeout(100000)

        it('Won\'t fetch keyring for an unsupported context', async function() {
            const account = new LimitedAccount({
                environment: EnvironmentType.TESTNET,
                privateKey: MNEMONIC,
                didClientConfig: DID_CLIENT_CONFIG
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
