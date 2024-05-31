require('dotenv').config();
import { DID_LIST, getBlockchainAPIConfiguration, ERC20Manager } from "@verida/vda-common-test"
import { EnvironmentType } from "@verida/types";
import { addInitialData } from "./helpers";
import { Wallet } from 'ethers';
import { VeridaXPRewardClient } from "../src/blockchain/userApi";

const assert = require('assert')

const privateKey = process.env.PRIVATE_KEY
if (!privateKey) {
    throw new Error('No PRIVATE_KEY in the env file');
}
const configuration = getBlockchainAPIConfiguration(privateKey);


const createXPRewardClientAPI = () => {
    return new VeridaXPRewardClient({
        network: EnvironmentType.TESTNET,
    })
}

describe("Verida RewardOwnerApi Test in Read mode", () => {
    let xpRewardClientApi;

    before(async () => {
        await addInitialData(configuration);
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