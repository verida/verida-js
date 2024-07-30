require('dotenv').config();
import { VeridaTokenOwner } from "../src/index"
import { BigNumber, Wallet } from "ethers";
import { BlockchainAnchor } from "@verida/types";

const assert = require('assert')

const privateKey = process.env.PRIVATE_KEY
if (!privateKey) {
    throw new Error('No PRIVATE_KEY in the env file');
}
const blockchainAnchor = process.env.BLOCKCHAIN_ANCHOR !== undefined ? BlockchainAnchor[process.env.BLOCKCHAIN_ANCHOR] : BlockchainAnchor.POLAMOY;
const owner = new Wallet(privateKey);

const createBlockchainAPI = async () => {
    return await VeridaTokenOwner.CreateAsync({
        blockchainAnchor,
        privateKey,
        rpcUrl: process.env.RPC_URL
    })
}

describe('VeridaTokenOwner test', function() {
    this.timeout(200*1000)

    let blockchainApi : VeridaTokenOwner;

    const tempMinter = Wallet.createRandom();
    const randomWallet = Wallet.createRandom();

    before(async () => {
        blockchainApi = await createBlockchainAPI();
    })

    it("Mint", async () => {
        const MINT_AMOUNT = 10;
        const orgBalance: BigNumber = await blockchainApi.balanceOf();

        await blockchainApi.mint(owner.address, BigNumber.from(MINT_AMOUNT));

        const newBalance: BigNumber = await blockchainApi.balanceOf();
        assert.ok(newBalance.eq(orgBalance.add(MINT_AMOUNT)), "Balance updated");
    })

    it("Add a minter", async () => {
        const orgMinterCount = await blockchainApi.getMinterCount();

        await blockchainApi.addMinter(tempMinter.address);

        const newMinterCount = await blockchainApi.getMinterCount();
        assert.ok(newMinterCount === (orgMinterCount + 1), "Minter count increased")
    })

    it("Revoke a minter", async () => {
        const orgMinterCount = await blockchainApi.getMinterCount();

        await blockchainApi.revokeMinter(tempMinter.address);

        const newMinterCount = await blockchainApi.getMinterCount();
        assert.ok(newMinterCount === (orgMinterCount - 1), "Minter count decreased")
    })

    it("Set AMM pair", async () => {
        const randomPair = Wallet.createRandom();

        let status = await blockchainApi.isAMMPair(randomPair.address);
        assert.ok(!status, "Not set as AMM pair");

        // Enable as AMM
        await blockchainApi.setAutomatedMarketMakerPair(randomPair.address);
        status = await blockchainApi.isAMMPair(randomPair.address);
        assert.ok(status === true, "Not set as AMM pair");

        // Disable
        await blockchainApi.setAutomatedMarketMakerPair(randomPair.address, false);
        status = await blockchainApi.isAMMPair(randomPair.address);
        assert.ok(status === false, "Not set as AMM pair");
    })

    it("Update token limit per wallet", async () => {
        const orgRate = await blockchainApi.maxAmountPerWalletRate();
        console.log("Org wallet limit : ", orgRate);

        await blockchainApi.updateMaxAmountPerWalletRate(orgRate + 0.001);

        const newRate = await blockchainApi.maxAmountPerWalletRate();
        assert.ok(newRate !== orgRate, "Max amount per wallet rate is updated");

        // Restore org value
        await blockchainApi.updateMaxAmountPerWalletRate(orgRate);
    })

    it("Update token limit per sell transaction", async () => {
        const orgRate = await blockchainApi.maxAmountPerSellRate();
        console.log("Org sell limit : ", orgRate);

        await blockchainApi.updateMaxAmountPerSellRate(orgRate + 0.001);

        const newRate = await blockchainApi.maxAmountPerSellRate();
        assert.ok(newRate !== orgRate, "Max amount per sell rate is updated");

        // Restore org value
        await blockchainApi.updateMaxAmountPerSellRate(orgRate);
    })

    it("Exclude from wallet amount limit", async () => {
        // Exclude
        await blockchainApi.excludeFromWalletAmountLimit(randomWallet.address, true);
        assert.ok(await blockchainApi.isExcludedFromWalletAmountLimit(randomWallet.address) === true, "Excluded")

        // Include
        await blockchainApi.excludeFromWalletAmountLimit(randomWallet.address, false);
        assert.ok(await blockchainApi.isExcludedFromWalletAmountLimit(randomWallet.address) === false, "Not excluded")
    })

    it("Exclude from sell amount limit", async () => {
        // Exclude
        await blockchainApi.excludeFromSellAmountLimit(randomWallet.address, true);
        assert.ok(await blockchainApi.isExcludedFromSellAmountLimit(randomWallet.address) === true, "Excluded")

        // Include
        await blockchainApi.excludeFromSellAmountLimit(randomWallet.address, false);
        assert.ok(await blockchainApi.isExcludedFromSellAmountLimit(randomWallet.address) === false, "Not excluded")
    })

    it("Enable/disable amount limit per wallet", async () => {
        await blockchainApi.enableMaxAmountPerWallet(true);
        assert.ok(await blockchainApi.isWalletAmountLimitEnabled() === true, 'Wallet amount limited');

        await blockchainApi.enableMaxAmountPerWallet(false);
        assert.ok(await blockchainApi.isWalletAmountLimitEnabled() === false, 'Wallet amount not limited');
    })

    it("Enable/disable amount limit per sell", async () => {
        await blockchainApi.enableMaxAmountPerSell(true);
        assert.ok(await blockchainApi.isSellAmountLimitEnabled() === true, 'Wallet amount limited');

        await blockchainApi.enableMaxAmountPerSell(false);
        assert.ok(await blockchainApi.isSellAmountLimitEnabled() === false, 'Wallet amount not limited');
    })

    it("Enable/disable token transfer", async () => {
        if (await blockchainApi.isTransferEnabled() === true) {
            console.log('Token transfer already enabled');
        } else {
            await blockchainApi.enableTransfer();
            assert.ok(await blockchainApi.isTransferEnabled(), 'Transfer enabled');
        }
    })

    it("Pause", async () => {
        await blockchainApi.pause();
        assert.ok(await blockchainApi.isPaused(), 'Contract paused');
        
    })

    it("Unpause", async () => {
        await blockchainApi.unpause();
        assert.ok(await blockchainApi.isPaused() === false, 'Contract unpaused');
    })





    /*
    describe('register', function() {
        it('Should reject for invalid names', async () => {
            const invalidnames = [
                'hello world.vda',   // Space in the name 
                'hello!world.vda',   // ! in the name
                'david.test.vda',    // More than one dot in the name
                'Jerry.test',           // Unregistered suffix
                'a.vda',             // Name leng should be over 1
                'abcdefghijklmnopqrstuvwxyz0123456.vda', // Name length should be below 33
            ]
            for (let i = 0; i < invalidnames.length; i++) {
                try {
                    const result = await blockchainApi.register(invalidnames[i])
                    assert.fail('Fail to register invalid name')
                } catch (err) {
                    assert.ok(err.message.match('Failed to register'), 'Fail to register invalid name')
                }
            }
        })
        
        it('Register successfully', async () => {
            for (let i = 0; i < REGISTER_COUNT; i++) {
                await blockchainApi.register(testNames[i])

                const nameDID = await blockchainApi.getDID(testNames[i])
                assert.equal(nameDID.toLowerCase(), did.address.toLowerCase(), 'Get registered DID')
            }
        })

        it('Should reject for registered name', async () => {
            try {
                const result = await blockchainApi.register(testNames[0])
                assert.fail('Fail to register invalid name')
            } catch (err) {
                assert.ok(err.message.match('Failed to register'), 'Fail to register invalid name')
            }
        })
    })
    */
   
})