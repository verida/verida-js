const assert = require('assert')

import { Client } from '../../src/index'
import { AutoAccount } from '@verida/account-node'
import CONFIG from '../config'
import { Wallet } from 'ethers'
import { EnvironmentType } from '@verida/types'

const ENVIRONMENT = EnvironmentType.TESTNET
const CONTEXT_NAME = ''
const DB_NAME = ''

const seedPhrase = ``
const privateKey = Wallet.fromMnemonic(seedPhrase).privateKey

/**
 * 
 */
describe.skip('Verida basic database tests', () => {
    let context, did, account

    const network = new Client({
        environment: ENVIRONMENT,
        didClientConfig: {
            network: ENVIRONMENT,
        }
    })

    describe('Basic tests', function() {
        this.timeout(600000)
        
        it('can do stuff', async function() {
            // Initialize account 1
            account = new AutoAccount({
                privateKey,
                environment: ENVIRONMENT,
                didClientConfig: CONFIG.DID_CLIENT_CONFIG
            })
            did = await account.did()
            console.log(did)
            await network.connect(account)
            context = await network.openContext(CONTEXT_NAME, false)

            const database = await context.openDatabase(DB_NAME)
            const data = await database.getMany()

            console.log(data)
        })

        this.afterAll(async () => {
            await context.close({
                clearLocal: true
            })
        })
    })
})