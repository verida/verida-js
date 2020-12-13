'use strict'
const assert = require('assert')
const ThreeIdProvider = require('3id-did-provider').default

describe('3ID connection', () => {
    it('can instantiate', async function() {
        const getPermission = function(request) {
            // always return true
            return request.payload.paths
        }
        const hexString = 'ab012345678901234567890123456789'
        const seed = Uint8Array.from(Buffer.from(hexString, 'hex'));
        assert(seed.length, 32, 'seed length is currect')
        console.log(ThreeIdProvider)

        const threeId = await ThreeIdProvider.create({ getPermission, seed })
        console.log(threeId)

        //assert(true, true, 'is true')
    });
});
