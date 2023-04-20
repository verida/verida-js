'use strict'
const assert = require('assert')

import { Client } from '../src/index'
import { AutoAccount } from '@verida/account-node'
import { StorageLink } from '@verida/storage-link'
import { DIDDocument } from '@verida/did-document'

import CONFIG from './config'

import { Wallet } from 'ethers'
const wallet = Wallet.createRandom()

/**
 * WARNING: These tests create a new DID and storage context everytime they run!
 */
describe('Storage initialization tests', () => {
    let didClient, did
    const network = new Client({
        environment: CONFIG.ENVIRONMENT,
        didClientConfig: {
            rpcUrl: CONFIG.DID_CLIENT_CONFIG.rpcUrl!
        }
    })

    describe('Initialize user storage contexts', function () {
        this.timeout(100 * 1000)

        it('can not force create a user storage context if not authenticated', async function () {
            const promise = new Promise((resolve, rejects) => {
                network.openContext(CONFIG.CONTEXT_NAME, true).then(rejects, resolve)
            })
            const result = await promise

            assert.deepEqual(result, new Error('Unable to force create a storage context when not connected'))
        })

        it('can authenticate a user', async function () {
            const account = new AutoAccount({
                privateKey: CONFIG.VDA_PRIVATE_KEY,
                environment: CONFIG.ENVIRONMENT,
                didClientConfig: CONFIG.DID_CLIENT_CONFIG
            })

            didClient = await account.getDidClient()
            did = await account.did()
            const seed = account.keyring(CONFIG.CONTEXT_NAME)

            assert.ok(did)
            assert.ok(seed)

            await network.connect(account)

            assert.ok(network.isConnected())
        })

        it(`cant open a user storage context that doesn't exist, even if authenticated`, async function () {
            const promise = new Promise((resolve, rejects) => {
                // open storage context without forcing it to be opened
                network.openContext('Random, invalid context name', false).then(rejects, resolve)
            })
            const result = await promise

            assert.deepEqual(result, new Error(`Unable to locate requested storage context (Random, invalid context name) for this DID (${did}) -- Storage context doesn't exist (try force create?)`))
        })

        it(`can force open a user storage context that doesn't exist when authenticated`, async function () {
            const accountContext = await network.openContext(CONFIG.CONTEXT_NAME, true)
            assert.ok(accountContext, 'Account storage opened')

            const accountStorageConfig = await accountContext.getContextConfig()
            const fetchedStorageConfig = await StorageLink.getLink(didClient, did, CONFIG.CONTEXT_NAME)

            accountStorageConfig.id = DIDDocument.generateContextHash(did, CONFIG.CONTEXT_NAME)

            assert.deepEqual(fetchedStorageConfig, accountStorageConfig, 'Storage context config matches')
        })
    })
})