const assert = require('assert')

import { explodeVeridaUri } from '../src/index'


describe('Util tests', () => {
    
    describe("Explode URI tests", function() {
        it('can handle all URI path types', () => {
            const uri1 = 'verida://did:vda:testnet:0x84746Ff2bC4E998fB23815f242d192912076e767/banksia/Verida:%20Vault/profile_public/basicProfile'
            const parts1 = explodeVeridaUri(uri1)
            assert.deepEqual({
                did: 'did:vda:testnet:0x84746Ff2bC4E998fB23815f242d192912076e767',
                network: 'banksia',
                contextName: 'Verida: Vault',
                dbName: 'profile_public',
                recordId: 'basicProfile',
                deepAttributes: [],
                query: {}
            }, parts1, 'Expected URI parts')

            const uri2 = 'verida://did:vda:testnet:0x84746Ff2bC4E998fB23815f242d192912076e767/banksia/Verida:%20Vault/profile_public/basicProfile'
            const parts2 = explodeVeridaUri(uri2)
            assert.deepEqual(parts1, parts2, 'Expected URI parts')

            const uri3 = 'verida://did:vda:testnet:0x84746Ff2bC4E998fB23815f242d192912076e767/banksia/Verida:%20Vault/profile_public/basicProfile/avatar'
            const parts3 = explodeVeridaUri(uri3)
            parts1.deepAttributes = ['avatar']
            assert.deepEqual(parts1, parts3, 'Expected deep attribute')

            const uri4 = 'verida://did:vda:testnet:0x84746Ff2bC4E998fB23815f242d192912076e767/banksia/Verida:%20Vault/profile_public/basicProfile/avatar/'
            const parts4 = explodeVeridaUri(uri4)
            assert.deepEqual(parts1, parts4, 'Expected deep attribute')

            const uri5 = 'verida://did:vda:testnet:0x84746Ff2bC4E998fB23815f242d192912076e767/banksia/Verida:%20Vault/profile_public/basicProfile/avatar/uri'
            const parts5  = explodeVeridaUri(uri5)
            parts1.deepAttributes = ['avatar', 'uri']
            assert.deepEqual(parts1, parts5, 'Expected deep attributes')

            const uri6 = 'verida://did:vda:testnet:0x84746Ff2bC4E998fB23815f242d192912076e767/banksia/Verida:%20Vault/profile_public/basicProfile/avatar/uri/'
            const parts6 = explodeVeridaUri(uri6)
            assert.deepEqual(parts1, parts6, 'Expected deep attributes')

            const uri7 = 'verida://did:vda:testnet:0x84746Ff2bC4E998fB23815f242d192912076e767/banksia/Verida:%20Vault/profile_public/basicProfile/avatar/uri?a=b&c=d'
            const parts7 = explodeVeridaUri(uri7)
            parts1.query = {
                a: 'b',
                c: 'd'
            }
            assert.deepEqual(parts1, parts7, 'Expected query params')

            const uri8 = 'verida://did:vda:testnet:0x84746Ff2bC4E998fB23815f242d192912076e767/banksia/Verida:%20Vault/profile_public/basicProfile/avatar/uri?a=b&c=d'
            const parts8 = explodeVeridaUri(uri8)
            parts1.query = {
                a: 'b',
                c: 'd'
            }
            assert.deepEqual(parts1, parts8, 'Expected query params')
        })

    })
})