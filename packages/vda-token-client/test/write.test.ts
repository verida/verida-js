require('dotenv').config();
import { VeridaTokenClient } from "../src/index"
import { BigNumber, Wallet } from "ethers";
import { BlockchainAnchor, Network } from "@verida/types";
import { DID_LIST } from "@verida/vda-common-test";
import { IMintInformation, mintToken } from "./utils";
import { getDefaultRpcUrl } from "@verida/vda-common";
import { JsonRpcProvider } from "@ethersproject/providers";

const assert = require('assert')

const privateKey = process.env.PRIVATE_KEY
if (!privateKey) {
    throw new Error('No PRIVATE_KEY in the env file');
}
const blockchainAnchor = process.env.BLOCKCHAIN_ANCHOR !== undefined ? BlockchainAnchor[process.env.BLOCKCHAIN_ANCHOR] : BlockchainAnchor.POLAMOY;
const rpcUrl = process.env.RPC_URL;

const createBlockchainAPI = async (walletKey: string) => {
    return await VeridaTokenClient.CreateAsync({
        blockchainAnchor,
        privateKey: walletKey,
        rpcUrl
    })
}

describe('VeridaTokenClient user tests', function() {
    this.timeout(200*1000)

    let blockchainApi : VeridaTokenClient;

    before(async () => {
        blockchainApi = await createBlockchainAPI(privateKey);
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
        const sender = new Wallet(DID_LIST[0].privateKey);
        const approver = new Wallet(DID_LIST[1].privateKey);
        const receiver = new Wallet(DID_LIST[2].privateKey);

        const AMOUNT_SEND = 1000;
        const AMOUNT_APPROVE = 1000;

        let senderApi: VeridaTokenClient;
        let approverApi: VeridaTokenClient;

        const checkBalances = async () => {
            const contractOwner = await blockchainApi.owner();
            const curUser = new Wallet(privateKey);
    
            const isOwner = contractOwner.toLowerCase() === curUser.address.toLowerCase();

            // Check token balances
            if (isOwner) {
                const mintAmounts : IMintInformation[] = [];
                if ((await blockchainApi.balanceOf(sender.address)).lt(AMOUNT_SEND * 100)) {
                    mintAmounts.push({to: sender.address, amount: BigNumber.from(AMOUNT_SEND*100)});
                }

                if ((await blockchainApi.balanceOf(approver.address)).lt(AMOUNT_APPROVE * 100)) {
                    mintAmounts.push({to: approver.address, amount: BigNumber.from(AMOUNT_APPROVE*100)});
                }

                await mintToken(privateKey, blockchainAnchor, mintAmounts, rpcUrl);
            } else {
                if ((await blockchainApi.balanceOf(sender.address)).lt(AMOUNT_SEND)) {
                    throw new Error(`Not enough token at ${sender.address}`);
                }

                if ((await blockchainApi.balanceOf(approver.address)).lt(AMOUNT_APPROVE)) {
                    throw new Error(`Not enough token at ${approver.address}`);
                }
            }

           // Check Matics
           const rpc = rpcUrl ?? getDefaultRpcUrl(blockchainAnchor);
           const provider = new JsonRpcProvider(rpc!);
           if ((await provider.getBalance(sender.address)).eq(0)) {
            throw new Error(`No Matict at ${sender.address}`);
           }

           if ((await provider.getBalance(approver.address)).eq(0)) {
            throw new Error(`No Matict at ${approver.address}`);
           }
        }

        before(async () => {
            await checkBalances();

            senderApi = await createBlockchainAPI(sender.privateKey);
            approverApi = await createBlockchainAPI(approver.privateKey);
        })

        describe("Get balance", () => {
            it("0 for random accounts", async () => {
                const randomAccount = Wallet.createRandom();
                const bal = await(blockchainApi.balanceOf(randomAccount.address));
                assert.ok(bal.eq(0), "No balance");
            })

            it("Get balances successfully", async () => {
                const bal = await blockchainApi.balanceOf(sender.address);
                assert.ok(bal.gt(0), "Get balance");
            })
        })

        describe("Transfer", () => {
            it("Transfer successfully", async () => {
                const orgReceiverBalance = await blockchainApi.balanceOf(receiver.address);

                await senderApi.transfer(receiver.address, AMOUNT_SEND);

                const newReceiverBalance = await blockchainApi.balanceOf(receiver.address);
                assert.ok(newReceiverBalance.eq(orgReceiverBalance.add(AMOUNT_SEND)), 'Transferred successfully');
            })
        })

        describe("Approve & transfer", () => {
            it("allowance", async () => {
                const value = await blockchainApi.allowance(approver.address, sender.address);
                assert.ok(value.gte(0), "Get allowance");
            })

            it("Approve", async () => {
                await approverApi.approve(sender.address, AMOUNT_APPROVE);
                const allowed = await blockchainApi.allowance(approver.address, sender.address);
                assert.ok(allowed.eq(AMOUNT_APPROVE), "Approved");
            })

            it("Transfer by `transferFrom` function", async () => {
                const orgReceiverBalance = await blockchainApi.balanceOf(receiver.address);

                await senderApi.transferFrom(approver.address, receiver.address, AMOUNT_APPROVE);

                const newReceiverBalance = await blockchainApi.balanceOf(receiver.address);
                assert.ok(newReceiverBalance.eq(orgReceiverBalance.add(AMOUNT_APPROVE)), 'Transferred successfully');
            })
        })
    })
})