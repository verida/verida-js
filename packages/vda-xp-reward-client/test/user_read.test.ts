require('dotenv').config();
<<<<<<< HEAD
import { getBlockchainAPIConfiguration } from "@verida/vda-common-test"
import { addInitialData } from "./helpers";
import { VeridaXPRewardClient } from "../src/blockchain/userApi";
import { Test_BlockchainAnchor } from "./const";
=======
import { DID_LIST, getBlockchainAPIConfiguration, ERC20Manager } from "@verida/vda-common-test"
import { EnvironmentType } from "@verida/types";
import { addInitialData } from "./helpers";
import { Wallet } from 'ethers';
import { VeridaXPRewardClient } from "../src/blockchain/userApi";
>>>>>>> 3b0946c30b18bb8815a5a89aeac04b595b2d6beb

const assert = require('assert')

const privateKey = process.env.PRIVATE_KEY
if (!privateKey) {
    throw new Error('No PRIVATE_KEY in the env file');
}
const configuration = getBlockchainAPIConfiguration(privateKey);


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