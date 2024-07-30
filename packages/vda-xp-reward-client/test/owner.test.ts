require('dotenv').config();
import { getBlockchainAPIConfiguration, ERC20Manager, DID_LIST, sleep } from "@verida/vda-common-test"
import { VeridaXPRewardOwnerApi } from '../src/blockchain/ownerApi';
import { addInitialData } from "./helpers";
import { BigNumber, Wallet } from 'ethers';
import { Test_BlockchainAnchor } from "./const";
import { VeridaTokenClient } from "@verida/vda-token-client";

const assert = require('assert')

const ownerPrivateKey = process.env.OWNER_PRIVATE_KEY;
if (!ownerPrivateKey) {
    throw new Error('No OWNER_PRIVATE_KEY in the env file');
}

const configuration = getBlockchainAPIConfiguration(ownerPrivateKey);
const ownerWallet = new Wallet(ownerPrivateKey);
const ownerDID = `did:vda:${Test_BlockchainAnchor}:${ownerWallet.address}`;

const createOwnerAPI = () => {
    return new VeridaXPRewardOwnerApi({
        blockchainAnchor: Test_BlockchainAnchor,
        did: ownerDID, // In fact, not used for owner functions. Used for read functions
        ...configuration
    })
}

describe("Verida XPRewardOwnerApi Test", () => {
    let ownerApi;
    let tokenApi: VeridaTokenClient;

    const DEPOSIT_AMOUNT = 10;

    before(async () => {
        ownerApi = createOwnerAPI();
        await addInitialData(configuration, ownerApi);

        tokenApi = await VeridaTokenClient.CreateAsync({
            blockchainAnchor: Test_BlockchainAnchor,
        })
    })

    describe("Trusted signer test", () => {
        const newSigner = Wallet.createRandom();

        it.only("Add a trusted signer",async () => {
            let response = await ownerApi.isTrustedSigner(newSigner.address);
            assert.equal(response, false);

            await ownerApi.addTrustedSigner(newSigner.address);

            response = await ownerApi.isTrustedSigner(newSigner.address);
            assert.equal(response, true);
        })

        it.only("Remove a trusted signer",async () => {
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

    describe("Deposit token", () => {
        it("Deposit successfully", async () => {
            const ownerBal: BigNumber = await tokenApi.balanceOf(ownerWallet.address);

            if (ownerBal.lt(DEPOSIT_AMOUNT)) {
                throw new Error("Not enough Token in the wallet");
            }

            await ownerApi.depositToken(DEPOSIT_AMOUNT);
            const ownerNewBal: BigNumber = await tokenApi.balanceOf(ownerWallet.address);

            assert.ok((ownerBal.sub(ownerNewBal)).eq(DEPOSIT_AMOUNT), "Deposited");
        })
    })

    describe("Withdraw", () => {
        const recipient = new Wallet(DID_LIST[0].privateKey);
        /**
         * Might be failed if the token address of the `XPRewardContract` is different from the `VDAToken` contract address
         */
        it("Withdraw successfully", async () => {
            const orgBalance: BigNumber = await tokenApi.balanceOf(recipient.address);

            await ownerApi.withdraw(recipient.address, DEPOSIT_AMOUNT);

            const newBalance: BigNumber = await tokenApi.balanceOf(recipient.address);
            assert.ok((newBalance.sub(orgBalance)).eq(DEPOSIT_AMOUNT), "Withdrawn");
        })
    })
})