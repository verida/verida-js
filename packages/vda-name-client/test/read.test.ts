require('dotenv').config();
import { getBlockchainAPIConfiguration } from "@verida/vda-common-test";
import { VeridaNameClient } from "../src/index"
import { addInitialDataV1, BLOCKCHAIN_ANCHOR, DID, DID_WALLET, REGISTERED_NAMES } from "./utils";

const assert = require('assert')

/**
 * Create and return `VeridaNameClient` instance in read-only mode
 * @returns VeridaNameClient instance
 */
const createBlockchainAPI = () => {
    return new VeridaNameClient({
        blockchainAnchor: BLOCKCHAIN_ANCHOR
    })
}

describe('vda-name-client read only tests', () => {
    let blockchainApi : VeridaNameClient


    before(async function() {
        this.timeout(200*1000)
        blockchainApi = createBlockchainAPI()

        // Check and add initial data
        const userNames = await blockchainApi.getUsernames(DID);
        if (userNames.length === 0) {
            const privateKey = process.env.PRIVATE_KEY
            if (privateKey !== undefined) {
                await addInitialDataV1(privateKey);
            } else {
                console.log("No 'PRIVATE_KEY' in the env file.");
                console.log("Test might be failed if not added initial data before.");
            }
        }
    })

    describe('Get usernames', function() {
        this.timeout(60*1000)

        it('Get usernames successfully', async () => {
            const usernames = await blockchainApi.getUsernames(DID)

            assert.deepEqual(
                usernames, 
                REGISTERED_NAMES,
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
            for (let i = 0; i < REGISTERED_NAMES.length; i++) {
                const foundDID = await blockchainApi.getDID(REGISTERED_NAMES[i])

                assert.equal(
                    foundDID,
                    DID,
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