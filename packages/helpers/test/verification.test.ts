const assert = require('assert')
import { verifyDidControlsDomain } from '../src/index'

const DID = 'did:vda:testnet:0x0Ece1EefE84d77951d6697558cba50774854b9E6'
const DOMAIN = 'team.verida.network'
const URI = 'http://team.verida.network'

describe('Verification tests', () => {
    
    describe(`Verify domain ${DOMAIN}`, function() {
        it('can verify domain without slash', async () => {
            const result = await verifyDidControlsDomain(DID, DOMAIN)
            assert(result, 'Domain without slash verifies correctly ')
        })

        it('can verify domain with slash', async () => {
            const result = await verifyDidControlsDomain(DID, `${DOMAIN}/`)
            assert(result, 'Domain with slash verifies correctly ')
        })

        it('can verify domain from URI', async () => {
            const result = await verifyDidControlsDomain(DID, URI)
            assert(result, 'URI verifies correctly ')
        })

        it('can verify with lower case DID', async () => {
            const result = await verifyDidControlsDomain(DID.toLowerCase(), DOMAIN)
            assert(result, 'Lower case DID verifies correctly ')
        })

    })
})