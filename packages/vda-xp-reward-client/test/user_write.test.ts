require('dotenv').config();
import { getBlockchainAPIConfiguration, ERC20Manager, TRUSTED_SIGNER } from "@verida/vda-common-test"
import { RECIPIENT_WALLET } from "@verida/vda-common-test"
import { EnvironmentType } from "@verida/types";
import { addInitialData, generateProof } from "./helpers";
import { Wallet, BigNumber, ethers } from 'ethers';
import { ClaimInfo } from "./const";
import { VeridaXPRewardClient } from "../src/blockchain/userApi";

import { CONTRACT_ADDRESS } from "@verida/vda-common";
import EncryptionUtils from "@verida/encryption-utils";

const assert = require('assert')

const privateKey = process.env.PRIVATE_KEY
if (!privateKey) {
    throw new Error('No PRIVATE_KEY in the env file');
}
const configuration = getBlockchainAPIConfiguration(privateKey);

// Create `VeridaXPRewardClient` in write mode
const createXPRewardClientAPI = (did:Wallet, configuration: any) => {
    return new VeridaXPRewardClient({
        did: `did:vda:testnet:${did.address}`,
        signKey: did.privateKey,
        network: EnvironmentType.TESTNET,
        ...configuration
    })
}

describe("Verida XPRewardOwnerApi Test in read/write mode", () => {
    let xpRewardClientApi: VeridaXPRewardClient;
    let tokenAPI: ERC20Manager;

    const userDID = Wallet.createRandom();
    const xpAmount = 100;
    const xpAmountWithUniqueId = 200;

    before(async () => {
        await addInitialData(configuration);
        xpRewardClientApi = createXPRewardClientAPI(new Wallet(userDID.privateKey), configuration);

        const TOKEN_ADDRESS = await xpRewardClientApi.getTokenAddress();
        const rewardXPContractAddress = CONTRACT_ADDRESS["VDAXPReward"].testnet!;

        // Create tokenAPI for claiming test
        tokenAPI = new ERC20Manager(
            TOKEN_ADDRESS,
            <string>process.env.RPC_URL,
            privateKey
        )

        // Calculate necessary amount of token for reward
        const totalXPAmount = xpAmount + xpAmountWithUniqueId;
        const conversionRate = Number(await xpRewardClientApi.getConversionRate());
        const tokenAmount = BigInt(totalXPAmount * conversionRate);
        
        // Check out token amount of xp reward contract
        if (await tokenAPI.balanceOf(rewardXPContractAddress) < tokenAmount) {
            if (process.env.NEED_TOKEN_MINT === `true`) {
                const mintAmount = tokenAmount;
                tokenAPI.mint(rewardXPContractAddress, mintAmount);
            } else {
                throw new Error(`Not enough token in the 'VDAXPReward' contract at ${rewardXPContractAddress}`);
            }            
        }
    })

    describe("Get function tests", () => {
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

    describe("Claim XP Reward", () => {
        const claimData: ClaimInfo = {
            typeId: `type-${new Date().getTime()}`,
            uniqueId: ``,
            issueYear: 0,
            issueMonth: 0,
            xp: 50n,
            signature: ''
        }

        const getProof = (didWallet:Wallet, data: ClaimInfo, trustedSigner: Wallet) => {
            const rawMsg = ethers.utils.solidityPack(
                ['address', 'string', 'uint16', 'uint8', 'uint'],
                [didWallet.address, `${data.typeId}${data.uniqueId}`, data.issueYear, data.issueMonth, data.xp]
            );
            const privateKeyArray = new Uint8Array(Buffer.from(trustedSigner.privateKey.slice(2), 'hex'))
            return EncryptionUtils.signData(rawMsg, privateKeyArray);
        }

        before(async () => {
            // Set issueYear and month
            const issueTime = new Date();
            issueTime.setMonth(issueTime.getMonth() - 1);
            claimData.issueYear = issueTime.getFullYear();
            claimData.issueMonth = issueTime.getMonth()+1;
        })

        it("Claim without `uniqueId`", async () => {
            claimData.xp = BigInt(xpAmount);
            claimData.uniqueId = '';
            claimData.signature = getProof(userDID, claimData, new Wallet(TRUSTED_SIGNER.privateKey));

            const orgBalance = await tokenAPI.balanceOf(RECIPIENT_WALLET.address);
            await xpRewardClientApi.claimXPReward(RECIPIENT_WALLET.address, [claimData])

            const newBalance = await tokenAPI.balanceOf(RECIPIENT_WALLET.address);

            assert.ok(newBalance > orgBalance);
        })

        it("Claim with `uniqueId`", async () => {
            claimData.typeId = `${claimData.typeId}-1`
            claimData.uniqueId = 'uniqueid-1';
            claimData.xp = BigInt(xpAmount);
            claimData.signature = getProof(userDID, claimData, new Wallet(TRUSTED_SIGNER.privateKey));

            const orgBalance = await tokenAPI.balanceOf(RECIPIENT_WALLET.address);
            await xpRewardClientApi.claimXPReward(RECIPIENT_WALLET.address, [claimData])

            const newBalance = await tokenAPI.balanceOf(RECIPIENT_WALLET.address);
            assert.ok(newBalance > orgBalance);
        })
    })
})