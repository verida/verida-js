require('dotenv').config();
import { getBlockchainAPIConfiguration, TRUSTED_SIGNER, ERC20Manager, REGISTERED_DIDS, DID_NODE_MAP, REGISTERED_DATACENTRES, REMOVED_DATACENTRES, REMOVE_START_DIDS, FALLBACK_DIDS, REGISTERED_LOCK_NODE } from "@verida/vda-common-test"
import { IStorageNode, VeridaNodeManager } from "../src/index"
import { Wallet, BigNumber } from "ethers";
import { BlockchainAnchor, EnumStatus } from "@verida/types";
import { addInitialData, generateAuthSignature, compareNodeData, getFallbackNodeInfo, FallbackNodeInfoStruct, getFallbackMigrationProof } from "./helpers";
import { getContractInfoForBlockchainAnchor } from "@verida/vda-common";


const assert = require('assert')

const privateKey = process.env.PRIVATE_KEY
if (!privateKey) {
    throw new Error('No PRIVATE_KEY in the env file');
}
const target_chain = BlockchainAnchor.DEVNET;

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
    const invalidCountryCodes = ['aYs', 'US', '']; //['AUS', 'A', '', 'ABC'];
    const invalidRegionCodes = [
        "",                 // Empty code
        "North America",    // Capital letter in the code
    ]

    let registeredCentreIds : BigNumber[] = [];

    before(async () => {
        registeredCentreIds = await addInitialData(configuration);
    })

    describe('Data centres', () => {
        let blockchainApi : VeridaNodeManager;

        const unregisteredCountry = ['sg', 'al'];
        const registeredCountry = ['us', 'uk'];
        const registeredRegion = ['north america', 'europe'];

        const checkDataCentresStatus = (centres: any[], status: EnumStatus) => {
            for (let i = 0; i < centres.length; i++) {
                assert.ok(centres[i].status === status, 'Status checked');
            }
        }

        before(() => {
            const user =  Wallet.createRandom();
            blockchainApi = createBlockchainAPI({
                address: `did:vda:testnet:${user.address}`,
                privateKey: user.privateKey
            });
        })

        describe('Check data centre name registered', () => {
            it("Return false for unregistered data centre name",async () => {
                const unregisterdNames = ['Invalid name', 'unregisterd-centre'];
                for (let i = 0; i < unregisterdNames.length; i++) {
                    const result = await blockchainApi.isRegisteredDataCentreName(unregisterdNames[i]);
                    assert.ok(result === false, 'False for unregistered name');
                }
            })
    
            it("Return true for registered data centre name",async () => {
                const activeNames = REGISTERED_DATACENTRES.map(item => item.name);
                for (let i = 0; i < activeNames.length; i++) {
                    const result = await blockchainApi.isRegisteredDataCentreName(activeNames[i]);
                    assert.ok(result === true, 'True for registered name');
                }
    
                const removedNames = REMOVED_DATACENTRES.map(item => item.name);
                for (let i = 0; i < removedNames.length; i++) {
                    const result = await blockchainApi.isRegisteredDataCentreName(removedNames[i]);
                    assert.ok(result === true, 'True for removed name');
                }
            })
        })

        describe('Get data centres', () => {
            describe('Get data centres by name', () => {
                const registeredNames = REGISTERED_DATACENTRES.map(item => item.name);
    
                it('Should reject for invalid name',async () => {
                    const invalidNames = ["Invalid Name", ...registeredNames];
                    try {
                        await blockchainApi.getDataCentresByName(invalidNames);
                    } catch (err) {
                        assert.ok(err.message.match('Failed to get datacentres by name'), 'Failed to get data centres')
                    }
                })
    
                it('Success',async () => {
                    let result = await blockchainApi.getDataCentresByName(registeredNames);
                    assert.ok(result.length === registeredNames.length, 'Get active data centres');
    
                    const removedNames = REMOVED_DATACENTRES.map(item => item.name);
                    result = await blockchainApi.getDataCentresByName(removedNames);
                    assert.ok(result.length === removedNames.length, 'Get removed data centres');
                })
            })
    
            describe('Get data centres by ID', () => {
                it('Should reject for invalid data centre ids', async () => {
                    const invalidIdGroup = [ BigNumber.from(0), ...registeredCentreIds];
    
                    try {
                        await blockchainApi.getDataCentresById(invalidIdGroup);
                    } catch (err) {
                        assert.ok(err.message.match('Failed to get datacentres'), 'Failed');
                    }
                })
    
                it('Get data centres by ids successfully', async () => {
                    const validIdGroup = [...registeredCentreIds];
    
                    const result = await blockchainApi.getDataCentresById(validIdGroup);
                    assert.ok(result.length === validIdGroup.length, 'Get same length data centres');
                })
            })
    
            describe('Get data centres by country code', () => {
                it("Should reject for invalid country code", async () => {
                    for (let i = 0; i < invalidCountryCodes.length; i++) {
                        try {
                            await blockchainApi.getDataCentresByCountryCode(invalidCountryCodes[i]);
                        } catch (err) {
                            assert.ok(err.message.match('Failed to get datacentres by country code'));
                        }
                    }
                })
    
                it("Should return empty array for unregistered country code", async () => {
                    for (let i = 0; i < unregisteredCountry.length; i++) {
                        const result = await blockchainApi.getDataCentresByCountryCode(unregisteredCountry[i]);
                        assert.deepEqual(result, [], 'Get empty array');
                    }
                })
    
                it("Success", async () => {
                    for (let i = 0; i < registeredCountry.length; i++) {
                        const result = await blockchainApi.getDataCentresByCountryCode(registeredCountry[i]);
                        assert.ok(result.length > 0, "Got successfully");
                    }
                })
    
                it("Success : Get with status",async () => {
                    let removedCountryCodes = REMOVED_DATACENTRES.map(item => item.countryCode);
                    removedCountryCodes = [...new Set(removedCountryCodes)];
                    for (let i = 0; i < removedCountryCodes.length; i++) {
                        const result = await blockchainApi.getDataCentresByCountryCode(removedCountryCodes[i], EnumStatus.removed);
                        checkDataCentresStatus(result, EnumStatus.removed);
                    }
                })
            })
    
            describe('Get data centres by region code', () => {
                it("Should reject for invalid region code", async () => {
                    for (let i = 0; i < invalidRegionCodes.length; i++) {
                        try {
                            await blockchainApi.getDataCentresByRegionCode(invalidRegionCodes[i]);
                        } catch (err) {
                            assert.ok(err.message.match('Failed to get datacentres by region code'));
                        }
                    }
                })
    
                it("Should return empty array for unregistered region code", async () => {
                    const unregisteredRegionCodes = [
                        "asia",
                        "africa"
                    ]
                    for (let i = 0; i < unregisteredRegionCodes.length; i++) {
                        const result = await blockchainApi.getDataCentresByRegionCode(unregisteredRegionCodes[i]);
                        assert.deepEqual(result, [], 'Get empty array');
                    }
                })
    
                it("Success", async () => {
                    for (let i = 0; i < registeredRegion.length; i++) {
                        const result = await blockchainApi.getDataCentresByRegionCode(registeredRegion[i]);
                        assert.ok(result.length > 0, "Got successfully");
                    }
                })
    
                it("Success : Get with status",async () => {
                    let removedRegionCodes = REMOVED_DATACENTRES.map(item => item.regionCode);
                    removedRegionCodes = [...new Set(removedRegionCodes)];
                    for (let i = 0; i < removedRegionCodes.length; i++) {
                        const result = await blockchainApi.getDataCentresByRegionCode(removedRegionCodes[i], EnumStatus.removed);
                        checkDataCentresStatus(result, EnumStatus.removed);
                    }
                })
            })
        })
    })

    describe('Storage Node', () => {
        
        let blockchainApi : VeridaNodeManager;
        
        const signer = new Wallet(TRUSTED_SIGNER.privateKey);
        const user =  Wallet.createRandom();
        const fallbackUser = Wallet.createRandom();

        const newNode = {
            name: 'node-' + user.address.toLowerCase(),
            endpointUri: 'https://' + user.address,
            countryCode: 'to',
            regionCode: 'oceania',
            datacentreId: 1,
            lat: 0,
            long: 0,
            slotCount: BigNumber.from(20000),
            acceptFallbackSlots: false
        };
        const fallbackNode = {
            name: 'node-' + user.address.toLowerCase() + '-fallback',
            endpointUri: 'https://' + user.address + '/fallback',
            countryCode: 'to',
            regionCode: 'oceania',
            datacentreId: 1,
            lat: 0,
            long: 0,
            slotCount: BigNumber.from(20000),
            acceptFallbackSlots: true
        }

        before(async () => {
            blockchainApi = createBlockchainAPI({
                address: `did:vda:testnet:${user.address}`,
                privateKey: user.privateKey
            });
        })

        describe('View functions test', () => {
            it("getVDATokenAddress",async () => {
                const result = await blockchainApi.getVDATokenAddress();
                assert.ok(typeof(result)==='string', 'Get token address');
            })
            
            it("isStakingRequired",async () => {
                const result = await blockchainApi.isStakingRequired();
                assert.ok(result !== undefined, 'Get staking required');
            })

            it("isWithdrawalEnabled",async () => {
                const result = await blockchainApi.isWithdrawalEnabled();
                assert.ok(result !== undefined, 'Get withdrawal enabled');
            })

            it("getStakePerSlot",async () => {
                const result = await blockchainApi.getStakePerSlot();
                assert.ok(typeof(result) === 'object', 'Get stake amount per slot');
            })

            it("getSlotCountRange",async () => {
                const result = await blockchainApi.getSlotCountRange();
                assert.ok(result !== undefined, 'Get slot count range');
            })

            it("getBalance",async () => {
                const result = await blockchainApi.getBalance(Wallet.createRandom().address);
                assert.ok(typeof(result) === 'object', 'Get balance');
            })

            it("excessTokenAmount",async () => {
                const result = await blockchainApi.excessTokenAmount(Wallet.createRandom().address);
                assert.ok(typeof(result) === 'object', 'Get excess token amount');
            })

            it("getNodeIssueFee",async () => {
                const result = await blockchainApi.getNodeIssueFee();
                assert.ok(typeof(result) === 'object', 'Get node issue fee');
            })

            it("getTotalIssueFee",async () => {
                const result = await blockchainApi.getTotalIssueFee();
                assert.ok(typeof(result) === 'object', 'Get total issue fee');
            })

            it("getSameNodeLogDuration",async () => {
                const result = await blockchainApi.getSameNodeLogDuration();
                assert.ok(typeof(result) === 'object', 'Get log duration per same node');
            })

            it("getLogLimitPerDay",async () => {
                const result = await blockchainApi.getLogLimitPerDay();
                assert.ok(typeof(result) === 'object', 'Get log limit per day');
            })
            
            it("getReasonCodeList",async () => {
                const result = await blockchainApi.getReasonCodeList();
                assert.ok(typeof(result) === 'object', 'Get list of available reason code');
            })

            it("getReasonCodeDescription",async () => {
                // Reject for invalid reason code
                try {
                    await blockchainApi.getReasonCodeDescription(11);
                } catch (e) {
                    assert.ok(true, "Rejected for invalid reason code");
                }

                const list = await blockchainApi.getReasonCodeList();

                const result = await blockchainApi.getReasonCodeDescription(list[0].reasonCode);
                assert.ok(typeof(result) === 'string', 'Get description of reason code');
            })
        })

        describe('Check registered informations', () => {
            let registeredNodeList: any[] = [];
            before(() => {
                DID_NODE_MAP.forEach((value: any) => {
                    registeredNodeList.push(value);
                });
            })

            describe('Check registered name', () => {
                it('False : unregistered name & invalid names',async () => {
                    const invalidNames = ['unregistered-node-name', 'InvalidName'];
                    for (let i = 0; i < invalidNames.length; i++) {
                        const result = await blockchainApi.isRegisteredNodeName(invalidNames[i]);
                        assert.ok(result === false, 'False for unregistered node name');
                    }
                })

                it('True : registered names',async () => {
                    const registeredNames = registeredNodeList.map(item => item.name);
                    for (let i = 0; i < registeredNames.length; i++) {
                        const result = await blockchainApi.isRegisteredNodeName(registeredNames[i]);
                        assert.ok(result === true, 'True for registered node name');
                    }
                })
            })

            describe('Check registered address', () => {
                it('False : unregistered address',async () => {
                    const result = await blockchainApi.isRegisteredNodeAddress(Wallet.createRandom().address);
                    assert.ok(result === false, 'False for unregistered node address');
                })

                it('True : registered address',async () => {
                    for (let i = 0; i < REGISTERED_DIDS.length; i++) {
                        const address = new Wallet(REGISTERED_DIDS[i].privateKey).address;
                        const result = await blockchainApi.isRegisteredNodeAddress(address);
                        assert.ok(result === true, 'True for registered node address');
                    }
                })
            })

            describe('Check registered endpoint', () => {
                it('False : unregistered address',async () => {
                    const result = await blockchainApi.isRegisteredNodeEndpoint("http://unregistered-node-address");
                    assert.ok(result === false, 'False for unregistered endpoint');
                })

                it('True : registered endpoint',async () => {
                    const registeredEndpoint = registeredNodeList.map(item => item.endpointUri);
                    for (let i = 0; i < registeredEndpoint.length; i++) {
                        const result = await blockchainApi.isRegisteredNodeEndpoint(registeredEndpoint[i]);
                        assert.ok(result === true, 'True for registered endpoint');
                    }
                })
            })
        })

        describe('Add Node', () => {
            it("Failed: Invalid name",async () => {
                const invalidNames = [
                    "",         // Empty name
                    "Invalid",  // No lower case letters
                ]
                for (let i = 0; i < invalidNames.length; i++) {
                    try {
                        await blockchainApi.addNode(invalidNames[i], "", "", "", 0, 0, 0, 0, false, "0x00");
                    } catch (err) {
                        assert.ok(err.message.match('Failed to add node'));
                    }
                }
            })

            it("Failed: Empty endpoint uri", async () => {
                try {
                    await blockchainApi.addNode("node-xxx", "", "", "", 0, 0, 0, 0, false, "0x00");
                } catch (err) {
                    assert.ok(err.message.match('Failed to add node'));
                }
            })

            it("Failed: Invalid country codes", async () => {
                for (let i = 0; i < invalidCountryCodes.length; i++) {
                    try {
                        await blockchainApi.addNode("node-xxx", "https://1", invalidCountryCodes[i], "", 0, 0, 0, 0, false, "0x00");
                    } catch (err) {
                        assert.ok(err.message.match('Failed to add node'));
                    }
                }
            })

            it("Failed: Invalid region codes", async () => {
                for (let i = 0; i < invalidRegionCodes.length; i++) {
                    try {
                        await blockchainApi.addNode("node-xxx", "https://1", "us", invalidRegionCodes[i], 0, 0, 0, 0, false, "0x00");
                    } catch (err) {
                        assert.ok(err.message.match('Failed to add node'));
                    }
                }
            })

            it("Failed: Invalid datacentreID", async () => {
                const invalidDatacentreIds = [0, 10000];

                for (let i = 0; i < invalidDatacentreIds.length; i++) {
                    try {
                        await blockchainApi.addNode("node-xxx", "https://1", "us", "north america", invalidDatacentreIds[i], 0, 0, 0, false, "0x00");
                    } catch (err) {
                        assert.ok(err.message.match('Failed to add node'));
                    }
                }
            })

            it("Failed: Invlaid Latitude",async () => {
                const invalidLatValues = [-90.05, 91];
                for (let i = 0; i < invalidLatValues.length; i++) {
                    try {
                        await blockchainApi.addNode("node-xxx", "https://1", "us", "north america", 1, invalidLatValues[i], 0, 0, false, "0x00");
                    } catch (err) {
                        assert.ok(err.message.match('Failed to add node'));
                    }
                }
            })

            it("Failed: Invalid Longitude",async () => {
                const invalidLongValues = [-180.1, 181];
                for (let i = 0; i < invalidLongValues.length; i++) {
                    try {
                        await blockchainApi.addNode("node-xxx", "https://1", "us", "north america", 1, 0, invalidLongValues[i], 0, false, "0x00");
                    } catch (err) {
                        assert.ok(err.message.match('Failed to add node'));
                    }
                }
            })
            
            it("Failed: Invalid auth signature",async () => {
                const badSigner = Wallet.createRandom();

                const badSignature = generateAuthSignature(user, badSigner);

                try {
                    await blockchainApi.addNode("node-xxx", "https://1", "us", "north america", 1, 0, 0, 0, false, badSignature);
                } catch (err) {
                    assert.ok(err.message.match('Failed to add node'));
                }
            })

            it("Success", async () => {
                const authSignature = generateAuthSignature(user, signer);

                try {
                    await blockchainApi.addNode(
                        newNode.name,
                        newNode.endpointUri,
                        newNode.countryCode,
                        newNode.regionCode,
                        newNode.datacentreId,
                        newNode.lat,
                        newNode.long,
                        newNode.slotCount,
                        newNode.acceptFallbackSlots,
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
            const nodes : any[] = []
            const users = [...REGISTERED_DIDS]

            before(() => {
                DID_NODE_MAP.forEach((did_node) => {
                    nodes.push(did_node);
                })

                nodes.push(newNode);
                users.push(user);
            })

            it("Get node by name",async () => {
                const selfNode = await blockchainApi.getNodeByName(newNode.name);
                assert.ok(compareNodeData(newNode, <IStorageNode>selfNode), "Get node by address");

                const others = await blockchainApi.getNodeByName(nodes[0].name);
                assert.ok(compareNodeData(nodes[0], <IStorageNode>others), "Get node by address");
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

            it("Get nodes by country code", async () => {
                const codeArr = nodes.map(item => item.countryCode);
                const countryCodes = [...new Set(codeArr)]

                for (let i = 0; i < countryCodes.length; i++) {
                    const countryNodes = nodes.filter(item => item.countryCode === countryCodes[i]);
                    const result = await blockchainApi.getNodesByCountryCode(countryCodes[i], 100, 1);

                    assert.ok(result.length >= countryNodes.length, "Get nodes by country code");
                }
            })

            it("Get nodes by country code and status",async () => {
                // Get `active` nodes
                const countryCode = newNode.countryCode;
                let result = await blockchainApi.getNodesByCountryCode(countryCode, 100, 1, EnumStatus.active);
                let filterdNodes = result.filter(item => item.name === newNode.name);
                assert.ok(compareNodeData(newNode, <IStorageNode>filterdNodes[0]), "Get nodes by country code and status");

                // Get `remove started` nodes
                const did = REMOVE_START_DIDS[0];
                const removedNode = DID_NODE_MAP.get(did.address);
                const removedCountryCode = removedNode.countryCode;
                result = await blockchainApi.getNodesByCountryCode(removedCountryCode, 100, 1, EnumStatus.removing);
                filterdNodes = result.filter(item => item.name === removedNode.name);
                assert.ok(compareNodeData(removedNode, <IStorageNode>filterdNodes[0]), "Get nodes by country code and status");
            })

            it("Get nodes by region code", async () => {
                const regionArr = nodes.map(item => item.regionCode);
                const regionCodes = [...new Set(regionArr)]

                for (let i = 0; i < regionCodes.length; i++) {
                    const regionNodes = nodes.filter(item => item.regionCode === regionCodes[i]);
                    const result = await blockchainApi.getNodesByRegionCode(regionCodes[i], 100, 1);

                    assert.ok(result.length >= regionNodes.length , "Get nodes by region code");
                }
            })

            it("Get nodes by region code and status",async () => {
                // Get `active` nodes
                const regionCode = newNode.regionCode;
                let result = await blockchainApi.getNodesByRegionCode(regionCode, 100, 1, EnumStatus.active);
                let filterdNodes = result.filter(item => item.name === newNode.name);
                assert.ok(compareNodeData(newNode, <IStorageNode>filterdNodes[0]), "Get nodes by region code and status");

                // Get `remove started` nodes
                const did = REMOVE_START_DIDS[0];
                const removedNode = DID_NODE_MAP.get(did.address);
                const removedregionCode = removedNode.regionCode;
                result = await blockchainApi.getNodesByRegionCode(removedregionCode, 100, 1, EnumStatus.removing);
                filterdNodes = result.filter(item => item.name === removedNode.name);
                assert.ok(compareNodeData(removedNode, <IStorageNode>filterdNodes[0]), "Get nodes by region code and status");
            })

            it("Get nodes by status", async () => {
                // Get `active` nodes
                let result = await blockchainApi.getNodesByStatus(EnumStatus.active, 100, 1);
                assert.ok(result.length >= REGISTERED_DIDS.length, "Get active nodes");

                // Get `pending removal` nodes
                result = await blockchainApi.getNodesByStatus(EnumStatus.removing, 100, 1);
                assert.ok(result.length > 0, "Get pending removal nodes");

                // Get `removed` nodes
                result = await blockchainApi.getNodesByStatus(EnumStatus.removed, 100, 1);
                assert.ok(result.length >= 0, "Get removed nodes");
            })
        })

        describe('Staking features', () => {
            let TOKEN_ADDRESS: string;
            let tokenAPI: ERC20Manager;

            const transactionSender = new Wallet(privateKey);
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
                TOKEN_ADDRESS = await blockchainApi.getVDATokenAddress();

                tokenAPI = new ERC20Manager(
                    TOKEN_ADDRESS,
                    <string>process.env.RPC_URL,
                    privateKey
                );

                if (process.env.NEED_MINT_TOKEN === 'true') {
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
    
        describe('Remove Node', () => {
            let fallbackInfo: FallbackNodeInfoStruct;            

            before(async() => {
                // Add fallback node
                const fallbackApi = createBlockchainAPI({
                    address: `did:vda:testnet:${fallbackUser.address}`,
                    privateKey: fallbackUser.privateKey
                })
                const authSignature = generateAuthSignature(fallbackUser, signer);
                try {
                    await fallbackApi.addNode(
                        fallbackNode.name,
                        fallbackNode.endpointUri,
                        fallbackNode.countryCode,
                        fallbackNode.regionCode,
                        fallbackNode.datacentreId,
                        fallbackNode.lat,
                        fallbackNode.long,
                        fallbackNode.slotCount,
                        fallbackNode.acceptFallbackSlots,
                        authSignature
                    );

                    const result = await fallbackApi.getNodeByAddress();
                    assert.ok(compareNodeData(fallbackNode, <IStorageNode>result));
                } catch (err) {
                    // console.log(err);
                    throw new Error(err);
                }


                // Get FallbackInfo for `removestartNode()` function
                fallbackInfo = getFallbackNodeInfo(fallbackUser, fallbackNode.slotCount);
            })

            describe('Remove node start', () => {
                it("Failed for invalid unregister time",async () => {
                    const currentInSec = Math.floor(Date.now() / 1000);
                    const invalidUnregisterTime = [
                        currentInSec,                       // Now
                        currentInSec + 27 * 24 * 60 * 60    //  27 days later
                    ];

                    for (let i = 0; i < invalidUnregisterTime.length; i++) {
                        try {
                            await blockchainApi.removeNodeStart(invalidUnregisterTime[i], fallbackInfo);
                        } catch (err) {
                            assert.ok(err.message.match('Failed to remove node start'), 'Invalid Unregister Time');
                        }
                    }
                })

                it("Failed for invalid fallback info",async () => {
                    const currentInSec = Math.floor(Date.now() / 1000);
                    const unregisterTime = currentInSec + 29 * 24 * 60 * 60; // 29 days later

                    const fallbackUser = new Wallet(FALLBACK_DIDS[0].privateKey);
                    const fallbackNodeInfo = DID_NODE_MAP.get(FALLBACK_DIDS[0].address);

                    // Insufficient slot count
                    let invalidFallackInfo = getFallbackNodeInfo(fallbackUser, 1);
                    try {
                        await blockchainApi.removeNodeStart(unregisterTime, invalidFallackInfo);
                    } catch (err) {
                        assert.ok(err.message.match('Failed to remove node start'), 'Insufficient slot count');
                    }

                    // Invalid signer
                    invalidFallackInfo = getFallbackNodeInfo(fallbackUser, fallbackNodeInfo.slotCount, Wallet.createRandom());
                    try {
                        await blockchainApi.removeNodeStart(unregisterTime, invalidFallackInfo);
                    } catch (err) {
                        assert.ok(err.message.match('Failed to remove node start'), 'Invalid fallback signer');
                    }

                })

                it("Success", async () => {
                    const currentInSec = Math.floor(Date.now() / 1000);
                    const unregisterTime = currentInSec + 29 * 24 * 60 * 60; // 29 days later

                    let node = <IStorageNode>(await blockchainApi.getNodeByAddress());
                    assert.ok(node.status === EnumStatus.active, 'Node is active');

                    // RemoveNode start
                    await blockchainApi.removeNodeStart(unregisterTime, fallbackInfo);

                    node = <IStorageNode>(await blockchainApi.getNodeByAddress());
                    assert.ok(node.status === EnumStatus.removing, 'Node is being removed');
                })
            })

            describe('Remove node complete', () => {
                let fallbackMigrationProof;            

                before(() => {
                    const fallbackUser = new Wallet(FALLBACK_DIDS[0].privateKey);
                    const fallbackNodeInfo = DID_NODE_MAP.get(FALLBACK_DIDS[0].address);
                    fallbackMigrationProof = getFallbackMigrationProof(
                        user.address,
                        fallbackUser.address,
                        fallbackUser
                    )
                })
                it("Failed : Calling before unregister time reached", async () => {
                    const fundReleasedTo = Wallet.createRandom();

                    try {
                        await blockchainApi.removeNodeComplete(fundReleasedTo.address, fallbackMigrationProof);
                    } catch (err) {
                        assert.ok(err.message.match('Failed to remove node complete'), 'Before unregisterTime reached');
                    }
                })
            })
        })

        describe('Lock features', () => {
            // VeridaNodeManager for registered DID
            let lockNodeApi: VeridaNodeManager;

            // VeridaNodeManager for unregistered DID
            const randomDID = Wallet.createRandom();
            let randomNodeApi : VeridaNodeManager;

            let TOKEN_ADDRESS: string;
            let tokenAPI: ERC20Manager;

            const transactionSender = new Wallet(privateKey);

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

                TOKEN_ADDRESS = await lockNodeApi.getVDATokenAddress();
                tokenAPI = new ERC20Manager(
                    TOKEN_ADDRESS,
                    <string>process.env.RPC_URL,
                    privateKey
                );

                let totalLockAmount = 0;
                for (let [, amount] of LOCK_AMOUNT_MAP) {
                    totalLockAmount += amount;
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