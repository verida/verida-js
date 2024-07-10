require('dotenv').config();
import { getBlockchainAPIConfiguration, ERC20Manager, REGISTERED_DIDS, REGISTERED_LOCK_NODE } from "@verida/vda-common-test"
import { VeridaNodeManager } from "../src/index"
import { Wallet, BigNumber } from "ethers";
import { BlockchainAnchor } from "@verida/types";
import { getContractInfoForBlockchainAnchor } from "@verida/vda-common";
import { addInitialData } from "./helpers";


const assert = require('assert')

const privateKey = process.env.PRIVATE_KEY
if (!privateKey) {
    throw new Error('No PRIVATE_KEY in the env file');
}
const target_chain = BlockchainAnchor.POLAMOY;

const nodeContractAddress = getContractInfoForBlockchainAnchor(target_chain, "storageNodeRegistry").address;

const configuration = getBlockchainAPIConfiguration(privateKey);
const createBlockchainAPI = (did: any) => {
    return new VeridaNodeManager({
        blockchainAnchor: target_chain,
        did: did.address,
        signKey: did.privateKey,
        ...configuration
    })
}

describe('vda-node-manager read and write tests', () => {
    
    before(async () => {
        await addInitialData(configuration);
    })
    

    describe('Storage Node Stake & Lock features', () => {

        let blockchainApi : VeridaNodeManager;

        /** Token contract address linked to the `StorageNodeRegistry` contract */
        let TOKEN_ADDRESS: string;
        let tokenAPI: ERC20Manager;
        let tokenOwner: string;

        /** The wallet for `PRIVATE_KEY` in the `.env` file*/
        const transactionSender = new Wallet(privateKey);
        
        const user =  Wallet.createRandom();

        before(async () => {
            blockchainApi = createBlockchainAPI({
                address: `did:vda:testnet:${user.address}`,
                privateKey: user.privateKey
            });

            TOKEN_ADDRESS = await blockchainApi.getVDATokenAddress();

            tokenAPI = new ERC20Manager(
                TOKEN_ADDRESS,
                <string>process.env.RPC_URL,
                privateKey
            );

            tokenOwner = await tokenAPI.owner();
        })

        describe('Staking features', () => {
            
            const depositAmount = BigNumber.from("5000");

            /**
             * Check `depositToken()` or `depositTokenFromProvider()` function
             * @param from The address of token provider.
             * @param to The address of `StorageNodeRegistry` contract
             * @param amount Token amount to be deposited
             */
            const checkDeposit =async (
                from: string, 
                nodeContract: string, 
                amount: BigNumber,
                methodName: "checkDeposit" | "checkDepositFromProvider"
            ) => {
                const orgExcessAmount: BigNumber = await blockchainApi.excessTokenAmount();
                const orgBalance: BigNumber = await tokenAPI.balanceOf(from);
                if (orgBalance.lt(amount)) {
                    throw new Error(`Need ${amount} token at address : ${from}`);
                }
                assert.ok(orgBalance.gte(depositAmount), "Enough token to deposit");

                // Approve transactionSender Token to node contract
                const allowance : BigNumber = await tokenAPI.allowance(from, nodeContract);
                if (allowance.lt(depositAmount) === true) {
                    throw new Error(`${from} need to approve ${amount} tokens to ${nodeContract}`);
                }

                // Deposit
                if (methodName === "checkDeposit") {
                    await blockchainApi.depositToken(depositAmount);
                } else {
                    await blockchainApi.depositTokenFromProvider(from, amount);
                }
                

                // Check deposit success
                const excessAmount : BigNumber = await blockchainApi.excessTokenAmount();
                assert.ok(excessAmount.eq(orgExcessAmount.add(depositAmount)), "Excess token increased");

                // Check sender's balance decreased
                const updatedBalance : BigNumber = await tokenAPI.balanceOf(from);
                assert.ok(updatedBalance.eq(orgBalance.sub(depositAmount)), "Sender balance decreased");
            }

            before(async () => {
                // If the `PRIVATE_KEY` is the owner of the token contract, mint & approve tokens
                if (tokenOwner.toLowerCase() === transactionSender.address.toLowerCase()) {
                    // Mint & approve
                    let balance: BigNumber = await tokenAPI.balanceOf(transactionSender.address);
                    if (balance.lt(depositAmount)) {
                        const mintAmount = depositAmount.sub(balance);
                        await tokenAPI.mint(transactionSender.address, mintAmount);

                        balance = await tokenAPI.balanceOf(transactionSender.address);
                    }
                    assert.ok(balance.gte(depositAmount), "Enough token to deposit");
                    await tokenAPI.approve(<string>nodeContractAddress, depositAmount);
                    
                    const provider = new Wallet(process.env.PROVIDER_KEY!);
                    balance = await tokenAPI.balanceOf(provider.address);
                    if (balance.lt(depositAmount)) {
                        const mintAmount = depositAmount.sub(balance);
                        await tokenAPI.mint(provider.address, mintAmount);

                        balance = await tokenAPI.balanceOf(provider.address);
                    }
                    assert.ok(balance.gte(depositAmount), "Enough token to deposit");

                    const providerTokenAPI = new ERC20Manager(
                        TOKEN_ADDRESS,
                        <string>process.env.RPC_URL,
                        provider.privateKey
                    );
                    await providerTokenAPI.approve(<string>nodeContractAddress, depositAmount)
                }
            })

            it("Excess token amount",async () => {
                const excessAmount = await blockchainApi.excessTokenAmount();
                assert.ok(excessAmount.isZero(), "No excess token for user");
            })

            it("deposit from self",async () => {
                await checkDeposit(transactionSender.address, <string>nodeContractAddress, depositAmount, "checkDeposit");
            })

            it("deposit from provider",async () => {
                if (!process.env.PROVIDER_KEY) {
                    throw new Error("No provider key in the env file");
                }
                const provider = new Wallet(process.env.PROVIDER_KEY!);

                await checkDeposit(provider.address, <string>nodeContractAddress, depositAmount, "checkDepositFromProvider");
            })

            it("Withdraw",async () => {
                // Check user excess amount
                const excessAmount : BigNumber = await blockchainApi.excessTokenAmount();
                assert.ok(excessAmount.gt(BigNumber.from(0)), "Excess token exist");

                const tokenBal : BigNumber = await tokenAPI.balanceOf(transactionSender.address);

                // Withdraw to the transaction sender, ofc can withdraw to any address
                const recipient = transactionSender.address;
                await blockchainApi.withdraw(recipient, excessAmount);

                // Check withdraw success
                const updatedExcessAmount : BigNumber = await blockchainApi.excessTokenAmount();
                assert.ok(updatedExcessAmount.eq(BigNumber.from(0)), "Withdrawn successfully");

                const updatedTokenBal : BigNumber = await tokenAPI.balanceOf(transactionSender.address);

                assert.ok(updatedTokenBal.eq(tokenBal.add(excessAmount)), "Token amount increased");
            })

            it("Log issue",async () => {
                const LOG_ISSUE_FEE : BigNumber = await blockchainApi.getNodeIssueFee();

                // Check & mint token for logging
                const balance: BigNumber = await tokenAPI.balanceOf(transactionSender.address);
                if (balance.lt(LOG_ISSUE_FEE)) {
                    const mintAmount = LOG_ISSUE_FEE.sub(balance);
                    await tokenAPI.mint(transactionSender.address, mintAmount);
                }

                // Allow token for logging
                const allowance : BigNumber = await tokenAPI.allowance(transactionSender.address, <string>nodeContractAddress);
                if (allowance.lt(LOG_ISSUE_FEE) === true) {
                    await tokenAPI.approve(<string>nodeContractAddress, LOG_ISSUE_FEE);
                }

                // Log issue
                const curTotalIssueFee: BigNumber = await blockchainApi.getTotalIssueFee();
                const nodeAddress = new Wallet(REGISTERED_DIDS[0].privateKey).address;
                await blockchainApi.logNodeIssue(nodeAddress, 10);

                const updatedTotalIssueFee: BigNumber = await blockchainApi.getTotalIssueFee();
                assert.ok(updatedTotalIssueFee.eq(curTotalIssueFee.add(LOG_ISSUE_FEE)), "Total issue fee increased");
            })
        })

        describe('Lock features', () => {
            // VeridaNodeManager for registered DID
            let lockNodeApi: VeridaNodeManager;

            // VeridaNodeManager for unregistered DID
            const randomDID = Wallet.createRandom();
            let randomNodeApi : VeridaNodeManager;


            type LOCK_PURPOSE_TYPE = "REGISTERED_DID_NO_DEPOSIT" | "REGISTERED_DID_WITH_DEPOSIT" |
                "UNREGISTERED_DID_NO_DEPOSIT" | "UNREGISTERED_DID_WITH_DEPOSIT";
            const LOCK_AMOUNT_MAP : Map<LOCK_PURPOSE_TYPE, number> = new Map([
                ["REGISTERED_DID_NO_DEPOSIT", 50],
                ["REGISTERED_DID_WITH_DEPOSIT", 100],
                ["UNREGISTERED_DID_NO_DEPOSIT", 80],
                ["UNREGISTERED_DID_WITH_DEPOSIT", 100]
            ]);

            const checkLock = async (
                nodeApi: VeridaNodeManager,
                purpose: string,
                lockAmount: BigNumber,
                withDeposit = false,
            ) => {
                const orgLockedAmount = await nodeApi.locked(purpose);

                await nodeApi.lock(purpose, lockAmount, withDeposit);

                const updateLockedAmount = await nodeApi.locked(purpose);

                assert.ok(lockAmount.eq(updateLockedAmount - orgLockedAmount), 'Locked correctly');
            }

            before(async () => {
                lockNodeApi = createBlockchainAPI({
                    address: REGISTERED_LOCK_NODE.address,
                    privateKey: REGISTERED_LOCK_NODE.privateKey
                })

                randomNodeApi = createBlockchainAPI({
                    address: `did:vda:testnet:${randomDID.address}`,
                    privateKey: randomDID.privateKey,
                })

                let totalLockAmount = 0;
                for (let [, amount] of LOCK_AMOUNT_MAP) {
                    totalLockAmount += amount;
                }

                if (tokenOwner.toLowerCase() !== transactionSender.address.toLowerCase()) {
                    throw new Error(`The 'PRIVATE_KEY' in the .env file is not the owner of the Token contract(${TOKEN_ADDRESS})`);
                }

                // Mint token to transaction sender if insufficient
                if ((await tokenAPI.balanceOf(transactionSender.address)) < totalLockAmount) {
                    await tokenAPI.mint(transactionSender.address, totalLockAmount);
                }
                // Approve token for deposit operation
                await tokenAPI.approve(<string>nodeContractAddress, totalLockAmount);
            })

            describe("Lock", () => {
                describe("Lock for registered DID", () => {
                    it("Success: Lock without token transfer", async () => {
                        // Check and add excess staked amount if necessary
                        const purpose: LOCK_PURPOSE_TYPE = "REGISTERED_DID_NO_DEPOSIT";
                        const lockAmount = LOCK_AMOUNT_MAP.get(purpose)!;
                        const excessAmount = await lockNodeApi.excessTokenAmount();
                        if (excessAmount < lockAmount) {
                            await lockNodeApi.depositToken(lockAmount);
                        }
    
                        await checkLock(lockNodeApi, purpose, BigNumber.from(lockAmount));
                    });
    
                    it("Success: Lock with token transfer", async () => {
                        const purpose: LOCK_PURPOSE_TYPE = "REGISTERED_DID_WITH_DEPOSIT";
                        await checkLock(lockNodeApi, purpose, BigNumber.from(LOCK_AMOUNT_MAP.get(purpose)), true);
                    })
                })

                describe("Lock for unregistered DID", () => {
                    it("Failed: Lock without token transfer - no staked amount", async () => {
                        const excessAmount = await randomNodeApi.excessTokenAmount() as BigNumber;
                        assert.ok(excessAmount.eq(0), 'No staked amount');

                        try {
                            await randomNodeApi.lock("UNREGISTERED_DID_NO_DEPOSIT", 10);
                        } catch(err) {
                            assert.ok(err.message.match('Failed to lock'), 'Failed to lock')
                        }
                    })

                    it("Success: Lock without token transfer", async () => {
                        // Deposit amount first
                        const purpose: LOCK_PURPOSE_TYPE = "UNREGISTERED_DID_NO_DEPOSIT";
                        const amount = LOCK_AMOUNT_MAP.get(purpose)!;
                        await randomNodeApi.depositToken(amount);

                        // Lock
                        await checkLock(randomNodeApi, purpose, BigNumber.from(amount));
                    })
                    
                    it("Success: Lock for unregistered DID with token transfer", async () => {
                        const purpose: LOCK_PURPOSE_TYPE = "UNREGISTERED_DID_WITH_DEPOSIT";
                        const amount = LOCK_AMOUNT_MAP.get(purpose)!;
                        await checkLock(randomNodeApi, purpose, BigNumber.from(amount), true);
                    })
                })
            })

            describe("Get locked amount for a given purpose", () => {
                const unknownPurpose = "purpose-unknown";
                describe("Get locked amount without `DIDAddress` parameter", () => {
                    it("Success: Return 0 for unknown purpose", async () => {
                        // For registered DID
                        let amount = await lockNodeApi.locked(unknownPurpose) as BigNumber;
                        assert.ok(amount.eq(0), "Get 0 for unknown purpose");
    
                        // For unregistered DID
                        amount = await randomNodeApi.locked(unknownPurpose) as BigNumber;
                        assert.ok(amount.eq(0), "Get 0 for unknown purpose");
                    })
                    it("Success: Get locked amount", async () => {
                        // For registered DID                    
                        let purposeList: LOCK_PURPOSE_TYPE[] = ["REGISTERED_DID_NO_DEPOSIT", "REGISTERED_DID_WITH_DEPOSIT"];
                        for (let purpose of purposeList) {
                            const amount = await lockNodeApi.locked(purpose) as BigNumber;
                            assert.ok(amount.gte(LOCK_AMOUNT_MAP.get(purpose)!), 'Get locked amount');
                        }
    
                        // For unregistered DID                    
                        purposeList = ["UNREGISTERED_DID_NO_DEPOSIT", "UNREGISTERED_DID_WITH_DEPOSIT"];
                        for (let purpose of purposeList) {
                            const amount = await randomNodeApi.locked(purpose) as BigNumber;
                            assert.ok(amount.gte(LOCK_AMOUNT_MAP.get(purpose)!), 'Get locked amount');
                        }
                    })
                })

                describe("Get locked amount with `DIDAddress` parameter", () => {
                    it("Success: Get locked amount", async () => {
                        // Get locked amount of registered DID from `VeridaNodeManager` instance for unregistred DID
                        const REGISTERED_DID_ADDRESS = new Wallet(REGISTERED_LOCK_NODE.privateKey).address;
                        let purposeList: LOCK_PURPOSE_TYPE[] = ["REGISTERED_DID_NO_DEPOSIT", "REGISTERED_DID_WITH_DEPOSIT"];
                        for (let purpose of purposeList) {
                            const amount = await randomNodeApi.locked(purpose, REGISTERED_DID_ADDRESS) as BigNumber;
                            assert.ok(amount.gte(LOCK_AMOUNT_MAP.get(purpose)!), 'Get locked amount');
                        }
    
                        // Get locked amount of unregistered DID from `VeridaNodeManager` instance for registred DID          
                        purposeList = ["UNREGISTERED_DID_NO_DEPOSIT", "UNREGISTERED_DID_WITH_DEPOSIT"];
                        for (let purpose of purposeList) {
                            const amount = await lockNodeApi.locked(purpose, randomDID.address) as BigNumber;
                            assert.ok(amount.gte(LOCK_AMOUNT_MAP.get(purpose)!), 'Get locked amount');
                        }
                    })
                })                
            })

            describe("Get locked information list", () => {
                it("Failed: Invalid page size", async () => {
                    const invalidPageSizeList = [0, 101, 200];
                    for (let pageSize of invalidPageSizeList) {
                        try {
                            await lockNodeApi.getLocks(pageSize, 1);
                        } catch (err) {
                            assert.ok(err.message.match('Failed to get locked information list'), 'Failed : Invalid page size');
                        }
                    }
                })

                it("Failed: Invalid page number", async () => {
                    try {
                        await lockNodeApi.getLocks(10, 0);
                    } catch (err) {
                        assert.ok(err.message.match('Failed to get locked information list'), 'Failed : Invalid page size');
                    }
                })

                it("Success: Empty array for a DID that has no lock", async () => {
                    const noLockDID = Wallet.createRandom();

                    const lockInfo = await lockNodeApi.getLocks(100, 1, noLockDID.address);
                    assert.ok(lockInfo.length === 0, "Get empty array");
                })

                it("Success: Empty array for out of range page information", async () => {
                    let lockInfo = await lockNodeApi.getLocks(100, 100);
                    assert.ok(lockInfo.length === 0, "Get empty array");

                    lockInfo = await randomNodeApi.getLocks(100, 100);
                    assert.ok(lockInfo.length === 0, "Get empty array");
                })

                it("Success: Get lock information list", async () => {
                    let lockInfo = await lockNodeApi.getLocks(10, 1);
                    assert.ok(lockInfo.length > 0, "Get lock information list");

                    lockInfo = await randomNodeApi.getLocks(10, 1);
                    assert.ok(lockInfo.length > 0, "Get lock information list");
                })
            })

            describe("Unlock", () => {
                const recipient = Wallet.createRandom();

                const checkUnlock = async (
                    nodeApi: VeridaNodeManager,
                    purpose: LOCK_PURPOSE_TYPE,
                    withdrawWallet?: string
                ) => {
                    const orgStakedAmount = await nodeApi.getBalance() as BigNumber;
                    const orgLockedAmount = await nodeApi.locked(purpose) as BigNumber;
                    let orgRecipientBalance = BigNumber.from(0);
                    if (withdrawWallet !== undefined) {
                        orgRecipientBalance = await tokenAPI.balanceOf(withdrawWallet!) as BigNumber;
                    }

                    if (!withdrawWallet) {
                        await nodeApi.unlock(purpose);
                    } else {
                        await nodeApi.unlock(purpose, withdrawWallet);
                    }

                    const updatedStakedAmount = await nodeApi.getBalance() as BigNumber;
                    const updatedLockedAmount = await nodeApi.locked(purpose) as BigNumber;

                    assert.ok(updatedLockedAmount.eq(0), 'Unlocked');
                    if (!withdrawWallet) {
                        assert.ok(updatedStakedAmount.eq(orgStakedAmount.add(orgLockedAmount)), 'Staked amount updated');
                    } else {
                        const recipientBalance = await tokenAPI.balanceOf(withdrawWallet!) as BigNumber;
                        
                        assert.ok(recipientBalance.eq(orgRecipientBalance.add(orgLockedAmount)));
                    }
                    
                }

                const checkUnlockFailed = async (
                    nodeApi: VeridaNodeManager,
                    purposeList: string[]
                ) => {
                    for (let purpose of purposeList) {
                        // Check without withdraw
                        try {
                            await nodeApi.unlock(purpose);
                        } catch (err) {
                            assert.ok(err.message.match("Failed to unlock"), "Failed for unknown purpose");
                        }

                        // Check with withdraw
                        try {
                            await nodeApi.unlock(purpose, recipient.address);
                        } catch (err) {
                            assert.ok(err.message.match("Failed to unlock"), "Failed for unknown purpose");
                        }
                    }
                }

                it("Failed: Unknown purpose - lock amount is 0", async () => {
                    const unknownPurpose = 'purpose-unknown';

                    await checkUnlockFailed(lockNodeApi, [unknownPurpose])

                    await checkUnlockFailed(randomNodeApi, [unknownPurpose])
                })

                it("Success: Unlock without withdraw", async () => {
                    await checkUnlock(lockNodeApi, "REGISTERED_DID_NO_DEPOSIT")
                    
                    await checkUnlock(randomNodeApi, "UNREGISTERED_DID_NO_DEPOSIT");
                })

                it("Success: Unlock with withdraw", async () => {
                    await checkUnlock(lockNodeApi, "REGISTERED_DID_WITH_DEPOSIT", recipient.address)
                    
                    await checkUnlock(randomNodeApi, "UNREGISTERED_DID_WITH_DEPOSIT", recipient.address);
                })

                it("Failed: Unlocked purposes", async () => {
                    await checkUnlockFailed(lockNodeApi, ["REGISTERED_DID_NO_DEPOSIT", "REGISTERED_DID_WITH_DEPOSIT"])

                    await checkUnlockFailed(randomNodeApi, ["UNREGISTERED_DID_NO_DEPOSIT", "UNREGISTERED_DID_WITH_DEPOSIT"])
                })
            })
        })
    })
})