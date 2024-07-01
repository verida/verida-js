require('dotenv').config();
import { getBlockchainAPIConfiguration } from "@verida/vda-common-test";
import { VeridaNameClient } from "../src/index"
import { BlockchainAnchor } from "@verida/types";

const assert = require('assert')

// An existing username and DID
const testNames = [
    'verida-tahpot-1.vda'
];
const didWallet = {
    address: '0xcD3EbA1884878c8a859D0452d45a8AbdB084e500',
    privateKey: '0x4abef2602c6419a8d86d04179b48c8988c4047cf5dba7917ebac703998094cb3',
    publicKey : '0x02c399cc41d4d511d0d8dcb41750aebdf893b03bf36ca6f579fb840da53a2d4af9'
};
const did = `did:vda:${BlockchainAnchor.POLAMOY}:0xcD3EbA1884878c8a859D0452d45a8AbdB084e500`

/**
 * Create and return `VeridaNameClient` instance in read-only mode
 * @returns VeridaNameClient instance
 */
const createBlockchainAPI = () => {
    return new VeridaNameClient({
        blockchainAnchor: BlockchainAnchor.DEVNET
    })
}

describe('vda-name-client read only tests', () => {
    let blockchainApi : VeridaNameClient

    const addInitialData = async () => {
        const privateKey = process.env.PRIVATE_KEY
        if (!privateKey) {
            throw new Error('No PRIVATE_KEY in the env file');
        }

        const configuration = getBlockchainAPIConfiguration(privateKey);
        const blockchainApiWrite = new VeridaNameClient({
            blockchainAnchor: BlockchainAnchor.DEVNET,
            did: did,
            signKey: didWallet.privateKey,
            ...configuration
        })

        await blockchainApiWrite.register(testNames[0]);
    }

    before(async () => {
        blockchainApi = createBlockchainAPI()

        // Check and add initial data
        const userNames = await blockchainApi.getUsernames(did);
        if (userNames.length === 0) {
            await addInitialData();
        }

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