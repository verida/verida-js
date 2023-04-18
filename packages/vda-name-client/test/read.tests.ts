require('dotenv').config();
import { VeridaNameClient } from "../src/index"
import { EnvironmentType } from "@verida/types";

const assert = require('assert')

// An existing username and DID
const testNames = [
    'verida-tahpot-1.vda'
];
const did = 'did:vda:testnet:0x65cA9ec85629F3bF4244faC3c387341E31e39675'

const createBlockchainAPI = () => {
    return new VeridaNameClient({
        network: EnvironmentType.TESTNET
    })
}

describe('vda-name-client read only tests', () => {
    let blockchainApi : VeridaNameClient
    before(() => {
        blockchainApi = createBlockchainAPI()
    })

    describe('Get usernames', function() {
        this.timeout(60*1000)

        it('Get usernames successfully', async () => {
            const usernames = await blockchainApi.getUsernames(did)

            assert.deepEqual(
                usernames, 
                testNames,
                'Get registered usernames');
        })

        it('Should reject for unregistered DID',async () => {
            const usernames = await blockchainApi.getUsernames('did:vda:testnet:0x0000000000000000000000000000000000000000')
            assert.deepEqual(usernames, [], 'Usernames are empty')
        })
    })

    describe('Get DID', function() {
        this.timeout(60*1000)
        
        it('Get DID successfully', async () => {
            for (let i = 0; i < testNames.length; i++) {
                const foundDID = await blockchainApi.getDID(testNames[i])

                assert.equal(
                    foundDID,
                    did,
                    'Get registered DID'
                )
            }
        })

        it('Should reject for unregistered usernames', async () => {
            try {
                const result = await blockchainApi.getDID('akdjakfadka')
                assert.fail('Username incorrectly fetched')
            } catch (err) {
                assert.ok(err.message.match('Failed to locate the DID'), 'Fail to get the DID')
            }
        })
    })
})