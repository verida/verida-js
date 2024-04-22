const assert = require('assert')
import { StorageLink } from '../src/index'
import { DIDClient } from '@verida/did-client'
import { CONTEXT_NAME } from './utils'
import { BlockchainAnchor, Network } from '@verida/types'
require('dotenv').config()

const NETWORK = Network.BANKSIA
const BLOCKCHAIN = BlockchainAnchor.POLAMOY

const MNEMONIC = "buddy lonely expire clump forum drum machine forget fence immune upon pen"
const didClient = new DIDClient({
    blockchain: BLOCKCHAIN
})
didClient.authenticate(MNEMONIC, 'web3', {
    privateKey: process.env.PRIVATE_KEY,
    rpcUrl: process.env.RPC_URL
}, [])
const DID = <string> didClient.getDid()

describe('Test storage links for a DID', () => {

    describe('Get links for an existing DID', function() {
        this.timeout(20000)

        it('can fetch all storage links', async function() {
            const storageLinks = await StorageLink.getLinks(NETWORK, didClient, DID)

            assert.ok(storageLinks, 'Got storage links')
        })

        it('can fetch known storage link', async function() {
            const storageLink = await StorageLink.getLink(NETWORK, didClient, DID, CONTEXT_NAME)

            assert.ok(storageLink, 'Got storage link for the vault')
        })
    })
})