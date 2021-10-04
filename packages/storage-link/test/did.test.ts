const assert = require('assert')
import { StorageLink } from '../src/index'
import CeramicClient from '@ceramicnetwork/http-client'

const CERAMIC_URL = 'https://ceramic-clay.3boxlabs.com'
const CONTEXT = 'Verida: Vault'
const DID = 'did:3:kjzl6cwe1jw1462ibvwlrc8rb7bmn0ku7cpx4cqw6z1q8vp227l5ztepe1f04qj'

describe('Test storage links for a DID', () => {

    describe('Get links for an existing DID', function() {
        this.timeout(20000)

        it('can fetch all stroage links', async function() {
            const ceramic = new CeramicClient(CERAMIC_URL)
            const storageLinks = await StorageLink.getLinks(ceramic, DID)
            // console.log(storageLinks)

            assert.ok(storageLinks, 'Got stroage links')
        })

        it('can fetch vault storage link', async function() {
            const ceramic = new CeramicClient(CERAMIC_URL)
            const storageLink = await StorageLink.getLink(ceramic, DID, CONTEXT)
            // console.log(storageLink)

            assert.ok(storageLink, 'Got storage link for the vault')
        })
    })
})