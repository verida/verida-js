require('dotenv').config();
import { getBlockchainAPIConfiguration } from "@verida/vda-common-test"
import { VeridaNameOwnerApi } from "../src/index"
import { Wallet } from "ethers";
import { APP_REGISTER_FEE, BLOCKCHAIN_ANCHOR, DID_WALLET } from "./utils";

const assert = require('assert')

const ownerPrivateKey = process.env.OWNER_PRIVATE_KEY;

if (!ownerPrivateKey) {
    throw new Error('No "OWNER_PRIVATE_KEY" in the env file');
}

const configuration = getBlockchainAPIConfiguration(ownerPrivateKey);
const createBlockchainAPI = (did: any) => {
    return new VeridaNameOwnerApi({
        blockchainAnchor: BLOCKCHAIN_ANCHOR,
        did: `did:vda:${BLOCKCHAIN_ANCHOR}:${did.address}`,
        // signKey: did.privateKey,
        ...configuration
    })
}

describe('vda-name-client owner test', function() {
    this.timeout(200*1000)

    let blockchainApi : VeridaNameOwnerApi;
    const REGISTER_COUNT = 5;

    before(async function()  {
        this.timeout(300*1000)
        blockchainApi = createBlockchainAPI(DID_WALLET);
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
            const orgLimit = Number(await blockchainApi.maxNamesPerDID());

            if (orgLimit < REGISTER_COUNT) {
                const newLimit = orgLimit + 1;
                await blockchainApi.updateMaxNamesPerDID(newLimit);

                const updatedLimit = Number(await blockchainApi.maxNamesPerDID());
                assert.ok(newLimit === updatedLimit, "Updated name count per DID");
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

            await blockchainApi.setAppRegisterEnabled(!isEnabled);
            assert.ok(await blockchainApi.isAppRegisterEnabled() === !isEnabled);

            await blockchainApi.setAppRegisterEnabled(isEnabled);
        })
    })
})