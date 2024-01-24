require('dotenv').config();
import { DID_LIST, getBlockchainAPIConfiguration, ERC20Manager, TRUSTED_SIGNER, DID_NODE_MAP, REGISTERED_DIDS } from "@verida/vda-common-test"
import { VeridaNodeOwnerApi, VeridaNodeManager, IStorageNode } from "../src/index"
import { BigNumber, BigNumberish, Wallet } from "ethers";
import { EnvironmentType } from "@verida/types";
import { expect } from "chai";
import { CONTRACT_ADDRESS } from "@verida/vda-common";
import { addInitialData, generateAuthSignature, compareNodeData } from "./helpers";


const assert = require('assert')

const privateKey = process.env.PRIVATE_KEY
if (!privateKey) {
    throw new Error('No PRIVATE_KEY in the env file');
}

const ownerDID = DID_LIST[0];
const configuration = getBlockchainAPIConfiguration(privateKey);

const createOwnerAPI = (did: any) => {
    return new VeridaNodeOwnerApi({
        did: did.address,
        signKey: did.privateKey,
        network: EnvironmentType.TESTNET,
        ...configuration
    })
}
const createNodeManagerAPI = (did: any) => {
    return new VeridaNodeManager({
        did: did.address,
        signKey: did.privateKey,
        network: EnvironmentType.TESTNET,
        ...configuration
    })
}

describe("Verida NodeOwnerApi Test", () => {
    let DATA_CENTER_IDS : BigNumberish[] = [];
    const ownerApi = createOwnerAPI(ownerDID);
    let tokenAPI: ERC20Manager;
    
    before(async () => {
        DATA_CENTER_IDS = await addInitialData(configuration, ownerApi);
        const TOKEN_ADDRESS = await ownerApi.getVDATokenAddress();

        tokenAPI = new ERC20Manager(
            TOKEN_ADDRESS,
            <string>process.env.RPC_URL,
            privateKey
        );
    
    })

    describe("Data centers", () => {
        const dataCenter = {
            name: "center-owner-test" + Wallet.createRandom().address.toLowerCase(),
            countryCode: "cl", 
            regionCode: "south america",
            lat: 0, 
            long: 0
        }
        
        it("Add data center",async () => {
            expect((await ownerApi.isRegisteredDataCenterName(dataCenter.name)) === false, "Data center not exist");
            
            await ownerApi.addDataCenter(
                dataCenter.name,
                dataCenter.countryCode,
                dataCenter.regionCode,
                dataCenter.lat,
                dataCenter.long
            );

            // await sleep(500);
            
            expect((await ownerApi.isRegisteredDataCenterName(dataCenter.name)) === true, "Data center added");
        })
    
        it("Remove data center by ID",async () => {
            expect((await ownerApi.isRegisteredDataCenterName(dataCenter.name)) === true, "Data center exist");

            let result = await ownerApi.getDataCentersByName([dataCenter.name]);
            await ownerApi.removeDataCenter(result[0].id);

            expect((await ownerApi.isRegisteredDataCenterName(dataCenter.name)) === false, "Data center removed");
        })

        it("Remove data center by name",async () => {
            const dataCenter = {
                name: "center-owner-test" + Wallet.createRandom().address.toLowerCase(),
                countryCode: "cl", 
                regionCode: "south america",
                lat: 0, 
                long: 0
            }
    
            // Add data center
            expect((await ownerApi.isRegisteredDataCenterName(dataCenter.name)) === false, "Data center not exist");
            await ownerApi.addDataCenter(
                dataCenter.name,
                dataCenter.countryCode,
                dataCenter.regionCode,
                dataCenter.lat,
                dataCenter.long
            );
            expect((await ownerApi.isRegisteredDataCenterName(dataCenter.name)) === true, "Data center added");

            // Remove data center
            await ownerApi.removeDataCenterByName(dataCenter.name);
            expect((await ownerApi.isRegisteredDataCenterName(dataCenter.name)) === false, "Data center removed");
        })
    })

    describe("Stake related values", () => {
        it("Set staking required",async () => {
            await ownerApi.setStakingRequired(true);
            expect(await ownerApi.isStakingRequired() === true, "Set as required");
            
            await ownerApi.setStakingRequired(false);
            expect(await ownerApi.isStakingRequired() === false, "Set as non-required");
        })

        it("Set withdrawal enabled",async () => {
            await ownerApi.setWithdrawalEnabled(false);
            expect(await ownerApi.isWithdrawalEnabled() === false, "Withdrawal disabled");
            
            await ownerApi.setWithdrawalEnabled(true);
            expect(await ownerApi.isWithdrawalEnabled() === true, "Withdrawal enabled");
        })
    
        it("Update stake per slot",async () => {
            const orgStakePerSlot : BigNumber = await ownerApi.getStakePerSlot();
            
            const newValue = orgStakePerSlot.add(1000);
            await ownerApi.updateStakePerSlot(newValue);
            expect(newValue.eq(await ownerApi.getStakePerSlot()), "Value updated");

            await ownerApi.updateStakePerSlot(orgStakePerSlot);
        })
    })

    describe("Slot count range", () => {
        it("Update minimum of slout count",async () => {
            const orgRange = await ownerApi.getSlotCountRange();
            const orgMinSlotCount : BigNumber = orgRange[0];

            const newMin = orgMinSlotCount.sub(1);
            await ownerApi.updateMinSlotCount(newMin);

            const updatedRange = await ownerApi.getSlotCountRange();
            expect(newMin.eq(updatedRange[0]));

            // Restore org value
            await ownerApi.updateMinSlotCount(orgMinSlotCount);
        })

        it("Update maximum of slout count",async () => {
            const orgRange = await ownerApi.getSlotCountRange();
            const orgMaxSlotCount : BigNumber = orgRange[1];

            const newMax = orgMaxSlotCount.add(1);
            await ownerApi.updateMaxSlotCount(newMax);

            const updatedRange = await ownerApi.getSlotCountRange();
            expect(newMax.eq(updatedRange[1]));

            // Restore org value
            await ownerApi.updateMaxSlotCount(orgMaxSlotCount);
        })
    })

    describe("Log issue", () => {
        // All transactions are sent by this wallet
        const transactionSender = new Wallet(privateKey);

        it("Update node issue fee",async () => {
            const orgIssue : BigNumber = await ownerApi.getNodeIssueFee();

            const newFee = orgIssue.add(100);
            await ownerApi.updateNodeIssueFee(newFee);

            expect(newFee.eq(await ownerApi.getNodeIssueFee()), "Fee updated");

            //restore
            await ownerApi.updateNodeIssueFee(orgIssue);

        })

        it("Update log duration for same node",async () => {
            const orgLogDuration : BigNumber = await ownerApi.getSameNodeLogDuration();

            const newDuration = orgLogDuration.add(10);
            await ownerApi.updateSameNodeLogDuration(newDuration);

            expect(newDuration.eq(await ownerApi.getSameNodeLogDuration()), "Duration updated");

            //restore
            await ownerApi.updateSameNodeLogDuration(orgLogDuration);
        })

        it("Update log limit per day",async () => {
            const orgLimit : BigNumber = await ownerApi.getLogLimitPerDay();

            const newLimit = orgLimit.add(1);
            await ownerApi.updateLogLimitPerDay(newLimit);

            expect(newLimit.eq(await ownerApi.getLogLimitPerDay()), "Limit updated");

            //restore
            await ownerApi.updateLogLimitPerDay(orgLimit);
        })

        it("Slash",async () => {
            // trusted signer
            const signer = new Wallet(TRUSTED_SIGNER.privateKey);

            // A user that logs an issue
            const user = Wallet.createRandom();
            
            // Issue reason code
            const REASON_CODE = 10; //Log issue reason code
            // Target node for logging the issue
            const targetNode = new Wallet(REGISTERED_DIDS[0].privateKey);

            // `StorageNodeRegistry` contract address. Used to approve tokens
            const contractAddress = CONTRACT_ADDRESS["StorageNodeRegistry"].testnet;

            const newNode = {
                name: 'node-' + user.address.toLowerCase(),
                endpointUri: 'https://' + user.address,
                countryCode: 'to',
                regionCode: 'oceania',
                datacenterId: 1,
                lat: 0,
                long: 0,
                slotCount: 20000,
                acceptFallbackSlots: false
            };

            const userApi = createNodeManagerAPI({
                address: `did:vda:testnet:${user.address}`,
                privateKey: user.privateKey
            });

            const nodeApi = createNodeManagerAPI({
                address: `did:vda:testnet:${targetNode.address}`,
                privateKey: targetNode.privateKey
            });

            // Set stakingRequired as true
            if ((await ownerApi.isStakingRequired()) === false) {
                await ownerApi.setStakingRequired(true);
            }
            
            // Add node
            /// Mint token to register a node
            let mintAmount : BigNumber = await userApi.getStakePerSlot();
            mintAmount = mintAmount.mul(newNode.slotCount);
            await tokenAPI.mint(transactionSender.address, mintAmount);
            await tokenAPI.approve(<string>contractAddress, mintAmount);
            /// Add node
            const authSignature = generateAuthSignature(user, signer);
            try {
                await userApi.addNode(
                    newNode.name,
                    newNode.endpointUri,
                    newNode.countryCode,
                    newNode.regionCode,
                    newNode.datacenterId,
                    newNode.lat,
                    newNode.long,
                    newNode.slotCount,
                    newNode.acceptFallbackSlots,
                    authSignature
                );
                const result = await userApi.getNodeByAddress();
                assert.ok(compareNodeData(newNode, <IStorageNode>result));
            } catch (err) {
                throw new Error(err);
            }

            // Log node issues
            const orgOwnerTotalFee : BigNumber = await ownerApi.getTotalIssueFee();
            
            mintAmount = await userApi.getNodeIssueFee();
            await tokenAPI.mint(transactionSender.address, mintAmount);
            await tokenAPI.approve(<string>contractAddress, mintAmount);

            await userApi.logNodeIssue(targetNode.address, REASON_CODE);

            const updateTotalFee : BigNumber = await ownerApi.getTotalIssueFee();
            assert.ok(updateTotalFee.eq(orgOwnerTotalFee.add(mintAmount)));

            // Slash
            const SLASH_AMOUNT = BigNumber.from("1000000");
            /// Deposit SLASH Amount to the target node to call slash
            await tokenAPI.mint(transactionSender.address, SLASH_AMOUNT);
            await tokenAPI.approve(<string>contractAddress, SLASH_AMOUNT);

            await nodeApi.depositToken(SLASH_AMOUNT);
            const nodeBalance : BigNumber = await nodeApi.getBalance();
            assert.ok(nodeBalance.gte(SLASH_AMOUNT));

            /// Slash
            const userOrgBalance: BigNumber = await userApi.getBalance();
            await ownerApi.slash(targetNode.address, REASON_CODE, SLASH_AMOUNT, "https://Slash_1");
            const userCurBalance: BigNumber = await userApi.getBalance();
            assert.ok(userCurBalance.gt(userOrgBalance));

            // Restore stakingRequired 
            await ownerApi.setStakingRequired(false);
        })

        it("Withdraw issue fee",async () => {
            // Check out total issue fee, if not log an issue
            const curTotalIssueFee: BigNumber = await ownerApi.getTotalIssueFee();
            assert.ok(curTotalIssueFee.gt(0));

            // Withdraw
            const orgBalance: BigNumber = await tokenAPI.balanceOf(transactionSender.address);
            await ownerApi.withdrawIssueFee(transactionSender.address, curTotalIssueFee);
            const curBalance: BigNumber = await tokenAPI.balanceOf(transactionSender.address);
            assert.ok(curBalance.eq(orgBalance.add(curTotalIssueFee)));
        })
    })
})