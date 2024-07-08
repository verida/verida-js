require('dotenv').config();
import { getBlockchainAPIConfiguration } from "@verida/vda-common-test";
import { VeridaTokenClient } from "../src/index"
import { BlockchainAnchor } from "@verida/types";

const assert = require('assert')

const privateKey = process.env.PRIVATE_KEY
if (!privateKey) {
    throw new Error('No PRIVATE_KEY in the env file');
}

/**
 * Create and return `VeridaTokenClient` instance in read-only mode
 * @returns VeridaTokenClient instance
 */
const createBlockchainAPI = async () => {
    return await VeridaTokenClient.CreateAsync({
        blockchainAnchor: BlockchainAnchor.DEVNET,
        // privateKey
    })
}

describe('vda-name-client read only tests', () => {
    let blockchainApi : VeridaTokenClient

    before(async () => {
        blockchainApi = await createBlockchainAPI()

    })

    describe('Get usernames', function() {
        this.timeout(60*1000)

        it('Get usernames successfully', async () => {
            const response = await blockchainApi.rateDenominator();

            console.log(response);
        })
    })

})