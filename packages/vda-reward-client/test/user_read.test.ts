require('dotenv').config();
import { getBlockchainAPIConfiguration } from "@verida/vda-common-test"
import { BlockchainAnchor } from "@verida/types";
import { addInitialData } from "./helpers";
import { CLAIM_TYPES } from "./const";
import { VeridaRewardClient } from "../src/blockchain/userApi";

const assert = require('assert')

const privateKey = process.env.PRIVATE_KEY
if (!privateKey) {
    throw new Error('No PRIVATE_KEY in the env file');
}
const configuration = getBlockchainAPIConfiguration(privateKey);


const createRewardClientAPI = () => {
    return new VeridaRewardClient({
        blockchainAnchor: BlockchainAnchor.DEVNET,
    })
}

describe("Verida RewardOwnerApi Test in Read mode", function() {
    let rewardClientApi;
    this.timeout(100 * 1000)

    before(async () => {
        await addInitialData(configuration);
        rewardClientApi = createRewardClientAPI();
    })

    it("Get claim type",async () => {
        for (let i = 0; i < CLAIM_TYPES.length; i++) {
            const response = await rewardClientApi.getClaimType(CLAIM_TYPES[i].id);
            assert.equal(response.reward, CLAIM_TYPES[i].reward);
        }
    })

    it("Get token address",async () => {
        const response = await rewardClientApi.getTokenAddress();
        assert.ok(response && typeof(response) === `string`, 'Get the result');
    })

    it("Get `StorageNodeContract` address",async () => {
        const response = await rewardClientApi.getStorageNodeContractAddress();
        assert.ok(response && typeof(response) === `string`, 'Get the result');
    })

})