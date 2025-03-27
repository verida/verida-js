const assert = require('assert')
import { StorageLink } from '../src/index'
import { DIDClient, VeridaDidWallet } from '@verida/did-client'
import { CONTEXT_NAME } from './utils'
import { BlockchainAnchor, Network } from '@verida/types'
require('dotenv').config()

const NETWORK = Network.BANKSIA
const BLOCKCHAIN = BlockchainAnchor.POLAMOY
const MNEMONIC = "pumpkin salad also husband east armor online simple chair perfect used heavy"

const veridaDidWallet = VeridaDidWallet.fromPrivateKeyOrMnemonic(MNEMONIC)

const didClient = new DIDClient({
    blockchain: BLOCKCHAIN
})

const DID = veridaDidWallet.did

describe('Test storage links for a DID', () => {
    before(async () => {
        await didClient.authenticate(veridaDidWallet.signer, 'web3', {
            privateKey: process.env.PRIVATE_KEY,
            rpcUrl: process.env.RPC_URL
        }, [])
    })

    describe('Get links for an existing DID', function() {
        this.timeout(20000)

        it('can fetch all storage links', async function () {
            const storageLinks = await StorageLink.getLinks(NETWORK, didClient, DID)
            console.log(storageLinks)

            assert.ok(storageLinks, 'Got storage links')
        })

        it('can fetch known storage link', async function() {
            const storageLink = await StorageLink.getLink(NETWORK, didClient, DID, CONTEXT_NAME)

            assert.ok(storageLink, 'Got storage link for the vault')
        })

        it('service endpoints specify the correct network', async function() {
            const didDoc = await didClient.get(DID)
            const document = didDoc.export()

            document.service?.forEach((item: any) => {
                console.log(item.id.match(NETWORK.toString()))
                assert.ok(item.id.match(NETWORK.toString()), `Service endpoint specifies the correct network (${NETWORK.toString()})`)
            })
        })
    })
})
