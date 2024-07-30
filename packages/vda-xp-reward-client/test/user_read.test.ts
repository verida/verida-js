require('dotenv').config();
import { getBlockchainAPIConfiguration } from "@verida/vda-common-test"
import { addInitialData } from "./helpers";
import { VeridaXPRewardClient } from "../src/blockchain/userApi";
import { Test_BlockchainAnchor } from "./const";

const assert = require('assert')

const createXPRewardClientAPI = () => {
    return new VeridaXPRewardClient({
        blockchainAnchor: Test_BlockchainAnchor
    })
}

describe("Verida RewardClientApi Test in Read mode", () => {
    let xpRewardClientApi;

    before(async () => {
        const ownerPrivateKey = process.env.OWNER_PRIVATE_KEY;
        if (ownerPrivateKey !== undefined) {
            const ownerConfiguration = getBlockchainAPIConfiguration(ownerPrivateKey);
            await addInitialData(ownerConfiguration);
        }
        xpRewardClientApi = createXPRewardClientAPI();
    })

    it("Get token address",async () => {
        const response = await xpRewardClientApi.getTokenAddress();
        assert.ok(response && typeof(response) === `string`, 'Get the result');
    })

    it("Get rate denominator",async () => {
        const response = await xpRewardClientApi.getRateDenominator();
        assert.ok(response && response > 0, 'Get the result');
    })

    it("Get conversion rate",async () => {
        const response = await xpRewardClientApi.getConversionRate();
        assert.ok(response && response > 0, 'Get the result');
    })
})