const assert = require('assert')

import { Client } from '../../src/index'
import { AutoAccount } from '@verida/account-node'
import CONFIG from '../config'
import { Wallet } from 'ethers'
import { EnvironmentType } from '@verida/types'

const ENVIRONMENT = EnvironmentType.MAINNET
const CONTEXT_NAME = 'Verida: Vault'
const DB_NAME = ''

const seedPhrase = ``
const privateKey = Wallet.fromMnemonic(seedPhrase).privateKey

/**
 * 
 */
describe('Verida basic database tests', () => {
    let context, did, account

    const network = new Client({
        environment: ENVIRONMENT,
        didClientConfig: {
            network: ENVIRONMENT,
        }
    })

    describe('Open network connection', function() {
        this.timeout(600000)
        
        it('can connect and load DID', async function() {
            // Initialize account 1
            account = new AutoAccount({
                privateKey,
                environment: ENVIRONMENT,
                didClientConfig: CONFIG.DID_CLIENT_CONFIG
            })
            did = await account.did()
            console.log(did)
            await network.connect(account)
        })

        it('can load DID doc', async function() {
            const didDoc = (await network.didClient.get(did)).export()
            console.log(didDoc)
            console.log(didDoc.service)
        })

        it('can output all contexts', async function() {
        })

        it('can output all databases for context', async function() {
            context = await network.openContext(CONTEXT_NAME, false)

            const database = await context.openDatabase('storage_database')
            const data = await database.getMany()
            for (let i in data) {
                console.log(data[i].dbName, data[i].dbHash, data[i].endpoint)
            }
        })

        this.afterAll(async () => {
            if (context) {
                await context.close({
                    clearLocal: true
                })
            }
        })
    })
})