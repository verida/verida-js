require('dotenv').config();
import { DID_LIST, getBlockchainAPIConfiguration, ERC20Manager } from "@verida/vda-common-test"
import { VeridaXPRewardOwnerApi } from '../src/blockchain/ownerApi';
import { EnvironmentType } from "@verida/types";
import { addInitialData } from "./helpers";
import { Wallet } from 'ethers';

const assert = require('assert')

const privateKey = process.env.PRIVATE_KEY
if (!privateKey) {
    throw new Error('No PRIVATE_KEY in the env file');
}
const configuration = getBlockchainAPIConfiguration(privateKey);


const createOwnerAPI = () => {
    const ownerDID = DID_LIST[0];

    return new VeridaXPRewardOwnerApi({
        did: ownerDID.address,
        network: EnvironmentType.TESTNET,
        ...configuration
    })
}

describe("Verida XPRewardOwnerApi Test", () => {
    let ownerApi;

    before(async () => {
        ownerApi = createOwnerAPI();
        await addInitialData(configuration, ownerApi);
    })

    describe("Trusted signer test", () => {
        const newSigner = Wallet.createRandom();

        it("Add a trusted signer",async () => {
            let response = await ownerApi.isTrustedSigner(newSigner.address);
            assert.equal(response, false);

            await ownerApi.addTrustedSigner(newSigner.address);

            response = await ownerApi.isTrustedSigner(newSigner.address);
            assert.equal(response, true);
        })

        it("Remove a trusted signer",async () => {
            await ownerApi.removeTrustedSigner(newSigner.address);

            const response = await ownerApi.isTrustedSigner(newSigner.address);
            assert.equal(response, false);
        })
    })

    describe("Set rate denominator", () => {
        let orgRateDenominator;
        before(async () => {
            orgRateDenominator = await ownerApi.getRateDenominator();
        })

        it("Set rate denominator", async () => {
            const newDenominator = orgRateDenominator * 100000000n;
            await ownerApi.setRateDenominator(newDenominator);

            const curDenominator = await ownerApi.getRateDenominator();
            assert.equal(newDenominator, curDenominator);
            
            // Restore denominator
            await ownerApi.setRateDenominator(orgRateDenominator);
        })
    })

    describe("Set conversion rate", () => {
        let orgConversionRate;
        before(async () => {
            orgConversionRate = await ownerApi.getConversionRate();
        })

        it("Set conversion rate", async () => {
            const newRate = orgConversionRate * 10;
            await ownerApi.setConversionRate(newRate);

            const curRate = await ownerApi.getConversionRate();
            assert.equal(newRate, curRate);

            // Restore rate
            await ownerApi.setConversionRate(orgConversionRate);
        })
    })

    describe("Withdraw", () => {

    })
})