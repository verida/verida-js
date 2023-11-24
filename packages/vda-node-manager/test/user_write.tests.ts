require('dotenv').config();
import { getBlockchainAPIConfiguration, TRUSTED_SIGNER, ERC20Manager, REGISTERED_DIDS, DID_NODE_MAP } from "@verida/vda-common-test"
import { IStorageNode, VeridaNodeManager } from "../src/index"
import { Wallet, BigNumber } from "ethers";
import { EnvironmentType } from "@verida/types";
import { TOKEN_ADDRESS } from "./const";
import { addInitialData, generateAuthSignature, compareNodeData } from "./helpers";
import { CONTRACT_ADDRESS } from "@verida/vda-common";


const assert = require('assert')

const privateKey = process.env.PRIVATE_KEY
if (!privateKey) {
    throw new Error('No PRIVATE_KEY in the env file');
}

const nodeContractAddress = CONTRACT_ADDRESS["StorageNodeRegistry"].testnet;

const tokenAPI = new ERC20Manager(
    TOKEN_ADDRESS,
    <string>process.env.RPC_URL,
    privateKey
);

const configuration = getBlockchainAPIConfiguration(privateKey);
const createBlockchainAPI = (did: any) => {
    return new VeridaNodeManager({
        did: did.address,
        signKey: did.privateKey,
        network: EnvironmentType.TESTNET,
        ...configuration
    })
}

describe('vda-node-manager read and write tests', () => {
    const invalidCountryCodes = ['aYs', 'US', '']; //['AUS', 'A', '', 'ABC'];
    const invalidRegionCodes = [
        "",                 // Empty code
        "North America",    // Capital letter in the code
    ]

    let registeredCenterIds : BigNumber[] = [];

    before(async () => {
        registeredCenterIds = await addInitialData(configuration);
    })

    describe('Get data centers', () => {
        let blockchainApi : VeridaNodeManager;

        const unregisteredCountry = ['sg', 'al'];
        const registeredCountry = ['us', 'uk'];
        const registeredRegion = ['north america', 'europe'];

        before(() => {
            const user =  Wallet.createRandom();
            blockchainApi = createBlockchainAPI({
                address: `did:vda:testnet:${user.address}`,
                privateKey: user.privateKey
            });
        })

        describe('Get data centers by ID', () => {
            it('Should reject for invalid data center ids', async () => {
                const invalidIdGroup = [ BigNumber.from(0), ...registeredCenterIds];

                try {
                    await blockchainApi.getDataCenters(invalidIdGroup);
                } catch (err) {
                    assert.ok(err.message.match('Failed to get datacenters'), 'Failed');
                }
            })

            it('Get data centers by ids successfully', async () => {
                const validIdGroup = [...registeredCenterIds];

                const result = await blockchainApi.getDataCenters(validIdGroup);
                assert.ok(result.length === validIdGroup.length, 'Get same length data centers');
            })
        })

        describe('Get data centers by country', () => {
            it("Should reject for invalid country code", async () => {
                for (let i = 0; i < invalidCountryCodes.length; i++) {
                    try {
                        await blockchainApi.getDataCentersByCountry(invalidCountryCodes[i]);
                    } catch (err) {
                        assert.ok(err.message.match('Failed to get datacenters by country'));
                    }
                }
            })

            it("Should return empty array for unregistered country code", async () => {
                for (let i = 0; i < unregisteredCountry.length; i++) {
                    const result = await blockchainApi.getDataCentersByCountry(unregisteredCountry[i]);
                    assert.deepEqual(result, [], 'Get empty array');
                }
            })

            it("Success", async () => {
                for (let i = 0; i < registeredCountry.length; i++) {
                    const result = await blockchainApi.getDataCentersByCountry(registeredCountry[i]);
                    assert.ok(result.length > 0, "Got successfully");
                }
            })
        })

        describe('Get data centers by region', () => {
            it("Should reject for invalid region code", async () => {
                for (let i = 0; i < invalidRegionCodes.length; i++) {
                    try {
                        await blockchainApi.getDataCentersByRegion(invalidRegionCodes[i]);
                    } catch (err) {
                        assert.ok(err.message.match('Failed to get datacenters by region'));
                    }
                }
            })

            it("Should return empty array for unregistered region code", async () => {
                const unregisteredRegionCodes = [
                    "asia",
                    "africa"
                ]
                for (let i = 0; i < unregisteredRegionCodes.length; i++) {
                    const result = await blockchainApi.getDataCentersByRegion(unregisteredRegionCodes[i]);
                    assert.deepEqual(result, [], 'Get empty array');
                }
            })

            it("Success", async () => {
                for (let i = 0; i < registeredRegion.length; i++) {
                    const result = await blockchainApi.getDataCentersByRegion(registeredRegion[i]);
                    assert.ok(result.length > 0, "Got successfully");
                }
            })
        })
    })

    describe('Storage Node', () => {
        let blockchainApi : VeridaNodeManager;
        const signer = new Wallet(TRUSTED_SIGNER.privateKey);
        const user =  Wallet.createRandom();

        const newNode = {
            endpointUri: 'https://' + user.address,
            countryCode: 'to',
            regionCode: 'oceania',
            datacenterId: 1,
            lat: 0,
            long: 0,
            slotCount: 20000
        };

        before(() => {
            blockchainApi = createBlockchainAPI({
                address: `did:vda:testnet:${user.address}`,
                privateKey: user.privateKey
            });
        })

        describe('Add Node', () => {
            it("Failed: Empty endpoint uri", async () => {
                try {
                    await blockchainApi.addNode("", "", "", 0, 0, 0, 0, "0x00");
                } catch (err) {
                    assert.ok(err.message.match('Failed to add node'));
                }
            })

            it("Failed: Invalid country codes", async () => {
                for (let i = 0; i < invalidCountryCodes.length; i++) {
                    try {
                        await blockchainApi.addNode("https://1", invalidCountryCodes[i], "", 0, 0, 0, 0, "0x00");
                    } catch (err) {
                        assert.ok(err.message.match('Failed to add node'));
                    }
                }
            })

            it("Failed: Invalid region codes", async () => {
                for (let i = 0; i < invalidRegionCodes.length; i++) {
                    try {
                        await blockchainApi.addNode("https://1", "us", invalidRegionCodes[i], 0, 0, 0, 0, "0x00");
                    } catch (err) {
                        assert.ok(err.message.match('Failed to add node'));
                    }
                }
            })

            it("Failed: Invalid datacenterID", async () => {
                const invalidDatacenterIds = [0, 10000];

                for (let i = 0; i < invalidDatacenterIds.length; i++) {
                    try {
                        await blockchainApi.addNode("https://1", "us", "north america", invalidDatacenterIds[i], 0, 0, 0, "0x00");
                    } catch (err) {
                        assert.ok(err.message.match('Failed to add node'));
                    }
                }
            })

            it("Failed: Invlaid Latitude",async () => {
                const invalidLatValues = [-90.05, 91];
                for (let i = 0; i < invalidLatValues.length; i++) {
                    try {
                        await blockchainApi.addNode("https://1", "us", "north america", 1, invalidLatValues[i], 0, 0, "0x00");
                    } catch (err) {
                        assert.ok(err.message.match('Failed to add node'));
                    }
                }
            })

            it("Failed: Invalid Longitude",async () => {
                const invalidLongValues = [-180.1, 181];
                for (let i = 0; i < invalidLongValues.length; i++) {
                    try {
                        await blockchainApi.addNode("https://1", "us", "north america", 1, 0, invalidLongValues[i], 0, "0x00");
                    } catch (err) {
                        assert.ok(err.message.match('Failed to add node'));
                    }
                }
            })
            
            it("Failed: Invalid auth signature",async () => {
                const badSigner = Wallet.createRandom();

                const badSignature = generateAuthSignature(user, badSigner);

                try {
                    await blockchainApi.addNode("https://1", "us", "north america", 1, 0, 0, 0, badSignature);
                } catch (err) {
                    assert.ok(err.message.match('Failed to add node'));
                }
            })

            it("Success", async () => {
                const authSignature = generateAuthSignature(user, signer);

                try {
                    await blockchainApi.addNode(
                        newNode.endpointUri,
                        newNode.countryCode,
                        newNode.regionCode,
                        newNode.datacenterId,
                        newNode.lat,
                        newNode.long,
                        newNode.slotCount,
                        authSignature
                    );

                    const result = await blockchainApi.getNodeByAddress();
                    assert.ok(compareNodeData(newNode, <IStorageNode>result));
                } catch (err) {
                    // console.log(err);
                    throw new Error(err);
                }
            })   
        })
    
        describe('Get Nodes', () => {
            const nodes : any[] = [] //[...REGISTERED_NODES];
            const users = [...REGISTERED_DIDS]

            before(() => {
                DID_NODE_MAP.forEach((did_node) => {
                    nodes.push(did_node);
                })

                nodes.push(newNode);
                users.push(user);
            })

            it("Get node by address", async () => {
                const selfNode = await blockchainApi.getNodeByAddress();
                assert.ok(compareNodeData(newNode, <IStorageNode>selfNode), "Get node by address");

                const others = await blockchainApi.getNodeByAddress(new Wallet(users[0].privateKey).address);
                assert.ok(compareNodeData(nodes[0], <IStorageNode>others), "Get node by address");
            })

            it("Get node by endpoint", async () => {
                const result = await blockchainApi.getNodeByEndpoint(newNode.endpointUri);
                assert.ok(compareNodeData(newNode, <IStorageNode>result), "Get node by address");
            })

            it("Get nodes by country", async () => {
                const codeArr = nodes.map(item => item.countryCode);
                const countryCodes = [...new Set(codeArr)]

                for (let i = 0; i < countryCodes.length; i++) {
                    const countryNodes = nodes.filter(item => item.countryCode === countryCodes[i]);
                    const result = await blockchainApi.getNodesByCountry(countryCodes[i]);

                    assert.ok(result.length >= countryNodes.length, "Get nodes by country code");
                }
            })

            it("Get nodes by region", async () => {
                const regionArr = nodes.map(item => item.regionCode);
                const regionCodes = [...new Set(regionArr)]

                for (let i = 0; i < regionCodes.length; i++) {
                    const regionNodes = nodes.filter(item => item.regionCode === regionCodes[i]);
                    const result = await blockchainApi.getNodesByRegion(regionCodes[i]);

                    assert.ok(result.length >= regionNodes.length , "Get nodes by region code");
                }
            })

        })

        describe('Staking features', () => {
            const transactionSender = new Wallet(privateKey);
            const depositAmount = BigNumber.from("5000");

            it("Excess token amount",async () => {
                const excessAmount = await blockchainApi.excessTokenAmount();
                assert.ok(excessAmount.isZero(), "No excess token for user");
            })

            it("deposit",async () => {
                let balance: BigNumber = await tokenAPI.balanceOf(transactionSender.address);
                if (balance.lt(depositAmount)) {
                    const mintAmount = depositAmount.sub(balance);
                    await tokenAPI.mint(transactionSender.address, mintAmount);

                    balance = await tokenAPI.balanceOf(transactionSender.address);
                }
                assert.ok(balance.gte(depositAmount), "Enough token to deposit");

                // Approve transactionSender Token to node contract
                const allowance : BigNumber = await tokenAPI.allowance(transactionSender.address, <string>nodeContractAddress);
                if (allowance.lt(depositAmount) === true) {
                    await tokenAPI.approve(<string>nodeContractAddress, depositAmount);
                }

                // Deposit
                await blockchainApi.depositToken(depositAmount);

                // Check deposit success
                const excessAmount : BigNumber = await blockchainApi.excessTokenAmount();
                assert.ok(excessAmount.eq(depositAmount), "Excess token increased");

                // Check sender's balance decreased
                const updatedBalance : BigNumber = await tokenAPI.balanceOf(transactionSender.address);
                assert.ok(updatedBalance.eq(balance.sub(depositAmount)), "Sender balance decreased");
            })

            it("Withdraw",async () => {
                // Check user excess amount
                const excessAmount : BigNumber = await blockchainApi.excessTokenAmount();
                assert.ok(excessAmount.gt(BigNumber.from(0)), "Excess token exist");

                const tokenBal : BigNumber = await tokenAPI.balanceOf(transactionSender.address);

                // Withdraw to the transaction sender, ofc can withdraw to any address
                await blockchainApi.withdraw(excessAmount);

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
    
        describe('Remove Node', () => {
            describe('Remove node start', () => {
                it("Failed for invalid unregister time",async () => {
                    const currentInSec = Math.floor(Date.now() / 1000);
                    const invalidUnregisterTime = [
                        currentInSec,                       // Now
                        currentInSec + 27 * 24 * 60 * 60    //  27 days later
                    ];

                    for (let i = 0; i < invalidUnregisterTime.length; i++) {
                        try {
                            await blockchainApi.removeNodeStart(invalidUnregisterTime[i]);
                        } catch (err) {
                            assert.ok(err.message.match('Failed to remove node start'), 'Invalid Unregister Time');
                        }
                    }
                })

                it("Success", async () => {
                    const currentInSec = Math.floor(Date.now() / 1000);
                    const unregisterTime = currentInSec + 29 * 24 * 60 * 60; // 29 days later

                    let node = <IStorageNode>(await blockchainApi.getNodeByAddress());
                    assert.ok(node.status === 'active', 'Node is active');

                    // RemoveNode start
                    await blockchainApi.removeNodeStart(unregisterTime);

                    node = <IStorageNode>(await blockchainApi.getNodeByAddress());
                    assert.ok(node.status === 'removed', 'Node is removed');
                })
            })

            describe('Remove node complete', () => {
                it("Failed : Calling before unregister time reached", async () => {
                    try {
                        await blockchainApi.removeNodeComplete();
                    } catch (err) {
                        assert.ok(err.message.match('Failed to remove node complete'), 'Before unregisterTime reached');
                    }
                })
            })
        })
    })
})