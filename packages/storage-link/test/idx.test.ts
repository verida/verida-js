'use strict'
import CeramicClient from '@ceramicnetwork/http-client'
const assert = require('assert')

import { Utils } from '@verida/3id-utils-node'
import { SecureContexts } from '../src/interfaces'
import { IDX } from '@ceramicstudio/idx'

// Test Ethereum Private key used to create / unlock a 3ID
//const CERAMIC_URL = 'https://ceramic-clay.3boxlabs.com'
const CERAMIC_URL = 'https://gateway-clay.ceramic.network'
const SECURE_CONTEXTS_SCHEMA_ID = 'kjzl6cwe1jw145rikixwqf0qf6d69982b72mtxbp96snvop9nsvlaf1avydww9f'
const DID = "did:3:zxy"


describe('IDX Basic test', () => {
    // Instantiate utils
    const utils = new Utils(CERAMIC_URL)

    describe('Get an IDX value', async function() {
        this.timeout(20000)

        it('can link a DID to a secure storage context', async function() {
            const ceramic = new CeramicClient(CERAMIC_URL)
            // @ts-ignore
            const idx = new IDX({ ceramic })
            console.log(ceramic)
            const secureContexts = <SecureContexts> await idx.get(SECURE_CONTEXTS_SCHEMA_ID, DID)

            console.log(secureContexts)

            assert.ok(true)
        })
    })
});
