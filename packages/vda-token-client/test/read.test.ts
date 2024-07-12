require('dotenv').config();
import { VeridaTokenClient } from "../src/index"
import { BigNumber, Wallet } from "ethers";
import { BlockchainAnchor } from "@verida/types";
import { DID_LIST } from "@verida/vda-common-test";

const assert = require('assert')

const blockchainAnchor = process.env.BLOCKCHAIN_ANCHOR !== undefined ? BlockchainAnchor[process.env.BLOCKCHAIN_ANCHOR] : BlockchainAnchor.POLAMOY;
const rpcUrl = process.env.RPC_URL;

const createBlockchainAPI = async () => {
    return await VeridaTokenClient.CreateAsync({
        blockchainAnchor,
        rpcUrl
    })
}

describe('VeridaTokenClient read-only mode test', function() {
    this.timeout(200*1000)

    let blockchainApi : VeridaTokenClient;

    before(async () => {
        blockchainApi = await createBlockchainAPI();
    })

    describe('General Token information', () => {
        it("name", async () => {
            const value = await blockchainApi.name();
            assert.ok(typeof value === 'string', 'Token name');
        })

        it("symbol", async () => {
            const value = await blockchainApi.symbol();
            assert.ok(typeof value === 'string', 'Token symbol');
        })

        it("decimals", async () => {
            const value = await blockchainApi.decimals();
            assert.ok(BigNumber.from(value).gte(0), 'Token decimals');
        })

        it("totalSupply", async () => {
            const value:BigNumber = (await blockchainApi.totalSupply())!;
            assert.ok(value.gte(0), 'Token total supply');
        })

        it("owner", async () => {
            const value = await blockchainApi.owner();
            assert.ok(typeof value === 'string', 'Token owner');
        })

        it("version", async () => {
            const value = await blockchainApi.getVersion();
            assert.ok(typeof value === 'string', 'Token version');
        })
    })

    describe('Verida-specified Token information', () => {
        const randomWallet = Wallet.createRandom();

        it("Number of minters", async () => {
            const value = await blockchainApi.getMinterCount();
            assert.ok(value >= 0, 'Number of minters');
        })

        it("List of minters", async () => {
            const value = await blockchainApi.getMinterList();
            assert.ok(value.length >= 0, 'List of minters');
        })

        it("Rate denominator", async () => {
            const value = await blockchainApi.rateDenominator();
            assert.ok(value >= 0, 'Rate denominator');
        })

        it("Max amount per wallet", async () => {
            const value = await blockchainApi.maxAmountPerWalletRate();
            assert.ok(value >= 0, 'Max amount per wallet');
        })

        it("Is wallet amount limit enabled", async () => {
            const value = await blockchainApi.isWalletAmountLimitEnabled();
            assert.ok(typeof value === 'boolean', 'Wallet amount limit enabled');
        })

        it("Is excluded from wallet amount limit", async () => {
            const value = await blockchainApi.isExcludedFromWalletAmountLimit(randomWallet.address);
            assert.ok(value === false, 'Excluded from wallet amount limit');
        })

        it("Max amount per sell transaction", async () => {
            const value = await blockchainApi.maxAmountPerSellRate();
            assert.ok(value >= 0, 'Max amount per sell');
        })

        it("Is sell amount limit enabled", async () => {
            const value = await blockchainApi.isSellAmountLimitEnabled();
            assert.ok(typeof value === 'boolean', 'Sell amount limit enabled');
        })

        it("Is excluded from sell amount limit", async () => {
            const value = await blockchainApi.isExcludedFromSellAmountLimit(randomWallet.address);
            assert.ok(value === false, 'Excluded from sell amount limit');
        })

        it("Is paused", async () => {
            const value = await blockchainApi.isPaused();
            assert.ok(typeof value === 'boolean', 'Paused');
        })

        it("Is transfer enabled", async () => {
            const value = await blockchainApi.isTransferEnabled();
            assert.ok(typeof value === 'boolean', 'Transfer enabled');
        })

        it("Is AMM pair", async () => {
            const value = await blockchainApi.isAMMPair(randomWallet.address);
            assert.ok(typeof value === 'boolean', 'Is AMM pair');
        })
    })

    describe("Token operations", () => {
        it("Get balance", async () => {
            const randomAccount = Wallet.createRandom();
            const bal = await(blockchainApi.balanceOf(randomAccount.address));
            assert.ok(bal.eq(0), "Get balance");
        })

        it("allowance", async () => {
            const sender = new Wallet(DID_LIST[0].privateKey);
            const approver = new Wallet(DID_LIST[1].privateKey);
            const value = await blockchainApi.allowance(approver.address, sender.address);
            assert.ok(value.gte(0), "Get allowance");
        })   
    })
})