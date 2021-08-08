'use strict'
const assert = require('assert')

import { Utils } from '@verida/3id-utils-node'

const ETH_PRIVATE_KEY = '0xc0da48347b4bcb2cfb08d6b8c26b52b47fd36ca6114974a0104d15fab076f553'
const CERAMIC_URL = 'http://localhost:7007' // Note: Requires running ceramic locally


describe('Auto account tests', () => {

    describe('Basic', function() {
        this.timeout(100000)

        it('verify signing', async function() {
            const utils = new Utils(CERAMIC_URL)
            const ceramic = await utils.createAccount('ethr', ETH_PRIVATE_KEY)
            const input = {message: 'test'}

            const jws = await ceramic.did!.createJWS(input)
            const dagJwsResult = fromDagJWS(jws)
            console.log('dagJws', dagJwsResult)

            console.log('signed jws', jws)
            console.log('The sig', jws.signatures[0].signature)
            const sig = jws.signatures[0].signature

            const result = await ceramic.did!.verifyJWS(dagJwsResult)
            console.log(result)
        })

    })
})
