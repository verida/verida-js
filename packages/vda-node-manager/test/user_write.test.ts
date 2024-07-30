require('dotenv').config();
import { getBlockchainAPIConfiguration, TRUSTED_SIGNER, REGISTERED_DIDS, DID_NODE_MAP, REGISTERED_DATACENTRES, REMOVED_DATACENTRES, REMOVE_START_DIDS, FALLBACK_DIDS } from "@verida/vda-common-test"
import { IStorageNode, VeridaNodeManager } from "../src/index"
import { Wallet, BigNumber } from "ethers";
import { BlockchainAnchor, EnumStatus } from "@verida/types";
import { addInitialData, generateAuthSignature, compareNodeData, getFallbackNodeInfo, FallbackNodeInfoStruct, getFallbackMigrationProof } from "./helpers";


const assert = require('assert')

const privateKey = process.env.PRIVATE_KEY
if (!privateKey) {
    throw new Error('No PRIVATE_KEY in the env file');
}
const blockchainAnchor = process.env.BLOCKCHAIN_ANCHOR !== undefined ? BlockchainAnchor[process.env.BLOCKCHAIN_ANCHOR] : BlockchainAnchor.POLAMOY;

const configuration = getBlockchainAPIConfiguration(privateKey);
const createBlockchainAPI = (did: any) => {
    return new VeridaNodeManager({
        blockchainAnchor,
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
    })
})