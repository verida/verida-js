require('dotenv').config();
import { DID_LIST, ERC20Manager, getBlockchainAPIConfiguration, ZERO_ADDRESS } from "@verida/vda-common-test"
import { IAppDataItem, VeridaNameClient, VeridaNameOwnerApi } from "../src/index"
import { BigNumber, Wallet } from "ethers";
import { BlockchainAnchor } from "@verida/types";
import { getContractInfoForBlockchainAnchor } from "@verida/vda-common";
import { addInitialDataV2, APP_REGISTER_FEE, appDataWithDomain, BLOCKCHAIN_ANCHOR, DID_OWNER, DID_WALLET } from "./utils";

const assert = require('assert')

const did = DID_WALLET;

const ownerPrivateKey = process.env.OWNER_PRIVATE_KEY;

if (!ownerPrivateKey) {
    throw new Error('No "OWNER_PRIVATE_KEY" in the env file');
}

const configuration = getBlockchainAPIConfiguration(ownerPrivateKey);
const createBlockchainAPI = (did: any) => {
    return new VeridaNameOwnerApi({
        blockchainAnchor: BLOCKCHAIN_ANCHOR,
        did: did.address,
        signKey: did.privateKey,
        ...configuration
    })
}

describe('vda-name-client owner test', function() {
    this.timeout(200*1000)

    let blockchainApi : VeridaNameOwnerApi;
    const REGISTER_COUNT = 5;

    before(async function()  {
        this.timeout(200*1000)
        blockchainApi = createBlockchainAPI(did);
    })

    describe("V1 features", () => {

        const testSuffix = "moon";

        it("Add suffix", async () => {
            const isRegistered: boolean = await blockchainApi.isValidSuffix(testSuffix);
            if (!isRegistered) {
                await blockchainApi.addSuffix(testSuffix);
            }
        })

        it("Update name count limit per DID", async () => {
            const curLimit = await blockchainApi.maxNamesPerDID();
            if (!curLimit.eq(REGISTER_COUNT)) {
                await blockchainApi.updateMaxNamesPerDID(REGISTER_COUNT);
            }
        })
        
    })

    describe("V2 features", () => {
        
        const testTokenAddress = "0x322F0273D7f6eCd9EeBc6C800a6777d1b3EEB697";
        
        it("Set token address", async () => {
            let tokenAddr = Wallet.createRandom().address;

            await blockchainApi.setTokenAddress(tokenAddr);
            assert.ok((await blockchainApi.getTokenAddress()).toLowerCase() === tokenAddr.toLowerCase(), 'Token address set');

            // Restore token address
            await blockchainApi.setTokenAddress(testTokenAddress);
        })

        it("Update app registering fee", async () => {
            const orgFee = await blockchainApi.getAppRegisterFee();

            const newFee = orgFee.mul(2).add(1000);
            await blockchainApi.updateAppRegisterFee(newFee);
            assert.ok((await blockchainApi.getAppRegisterFee()).eq(newFee), 'Fee updated');

            if (orgFee.eq(0)) {
                await blockchainApi.updateAppRegisterFee(APP_REGISTER_FEE);
            } else {
                await blockchainApi.updateAppRegisterFee(orgFee);
            }
        })

        it("Enable app registering", async () => {
            const isEnabled = await blockchainApi.isAppRegisterEnabled();

            await blockchainApi.enableAppRegister(!isEnabled);
            assert.ok(await blockchainApi.isAppRegisterEnabled() === !isEnabled);

            await blockchainApi.enableAppRegister(isEnabled);
        })
    })
})