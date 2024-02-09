require('dotenv').config();
import { VeridaNodeManager } from "../src/index"
import { EnvironmentType, EnumStatus } from "@verida/types";
import { BigNumber, Wallet } from 'ethers';
import { addInitialData, compareNodeData } from "./helpers";
import { REGISTERED_DIDS, DID_NODE_MAP, getBlockchainAPIConfiguration, REGISTERED_DATACENTRES, REMOVED_DATACENTRES, REMOVE_START_DIDS } from "@verida/vda-common-test";

const assert = require('assert')

// Need to add initial data when the contract first deployed
const privateKey = process.env.PRIVATE_KEY
if (!privateKey) {
    throw new Error('No PRIVATE_KEY in the env file');
}
const configuration = getBlockchainAPIConfiguration(privateKey);


const createBlockchainAPI = () => {
    return new VeridaNodeManager({
        network: EnvironmentType.TESTNET
    })
}

describe('vda-node-manager read only tests', () => {
    let registeredCentreIds : BigNumber[] = [];
    let blockchainApi : VeridaNodeManager

    before(async () => {
        registeredCentreIds = await addInitialData(configuration);
        blockchainApi = createBlockchainAPI()
    })

    describe("Data Centre test", () => {
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
            const unregisteredCountry = ['sg', 'al'];
            const registeredCountry = ['us', 'uk'];
            const registeredRegion = ['north america', 'europe'];

            it('Get data centres by names',async () => {
                const names = REGISTERED_DATACENTRES.map(item => item.name);
                const result = await blockchainApi.getDataCentresByName(names);
                assert.ok(result.length === names.length, 'Get same length data centres');
            })
    
            it('Get data centres by ids',async () => {
                const validIdGroup = [...registeredCentreIds]
                const result = await blockchainApi.getDataCentresById(validIdGroup);
                assert.ok(result.length === validIdGroup.length, 'Get same length data centres');
            })
    
            it('Get data centres by country code', async () => {
                // Empty array for unregistered countries
                for (let i = 0; i < unregisteredCountry.length; i++) {
                    const result = await blockchainApi.getDataCentresByCountryCode(unregisteredCountry[i]);
                    assert.deepEqual(result, [], 'Get empty array');
                }
    
                // Get result for registered countries
                for (let i = 0; i < registeredCountry.length; i++) {
                    const result = await blockchainApi.getDataCentresByCountryCode(registeredCountry[i]);
                    assert.ok(result.length > 0, "Got successfully");
                }
            })
    
            it('Get data centres by region code', async () => {
                // Empty array for unregistered regions            
                const unregisteredRegionCodes = [
                    "asia",
                    "africa"
                ]
                for (let i = 0; i < unregisteredRegionCodes.length; i++) {
                    const result = await blockchainApi.getDataCentresByRegionCode(unregisteredRegionCodes[i]);
                    assert.deepEqual(result, [], 'Get empty array');
                }
    
                // Get result for registered regions
                for (let i = 0; i < registeredRegion.length; i++) {
                    const result = await blockchainApi.getDataCentresByRegionCode(registeredRegion[i]);
                    assert.ok(result.length > 0, "Got successfully");
                }
            })
        })
    })

    describe('Storage Node Test', () => {
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
        
        describe('Get storage node', () => {
            let nodes: any[]  = [];
            let users: Wallet[]= [];
    
            before(() => {
                users = REGISTERED_DIDS.map((item) => new Wallet(item.privateKey));
                DID_NODE_MAP.forEach((value) => {
                    nodes.push(value);
                })
            })
    
            it("Get node by name",async () => {
                // Failed for invalid name
                try {
                    await blockchainApi.getNodeByName("Invalid");
                } catch(err) {
                    assert.ok(err.message.match('Failed to get node by name'), 'Invalid name');
                }
    
                // Success
                const result = await blockchainApi.getNodeByName(nodes[0].name);
                assert.ok(compareNodeData(nodes[0], result), "Get node by address");
            })
    
            it("Get node by address", async () => {
                // Failed for empty didAddress
                try {
                    await blockchainApi.getNodeByAddress();
                } catch(err) {
                    assert.ok(err.message.match('Need didAddress in read only mode'), 'Empty didAddress');
                }
    
                // Success
                const others = await blockchainApi.getNodeByAddress(users[0].address);
                assert.ok(compareNodeData(nodes[0], others), "Get node by address");
            })
    
            it("Get node by endpoint", async () => {
                const result = await blockchainApi.getNodeByEndpoint(nodes[0].endpointUri);
                    assert.ok(compareNodeData(nodes[0], result), "Get node by address");
            })
    
            it("Get nodes by country code", async () => {
                const codeArr = nodes.map(item => item.countryCode);
                const countryCodes = [...new Set(codeArr)]
    
                for (let i = 0; i < countryCodes.length; i++) {
                    const countryNodes = nodes.filter(item => item.countryCode === countryCodes[i]);
                    const result = await blockchainApi.getNodesByCountryCode(countryCodes[i]);
    
                    assert.ok(countryNodes.length === result.length, "Get nodes by country code");
                }
            })

            it("Get nodes by country code and status",async () => {
                const codeArr = nodes.map(item => item.countryCode);
                const countryCodes = [...new Set(codeArr)]

                // Get `active` nodes
                for (let i = 0; i < countryCodes.length; i++) {
                    let result = await blockchainApi.getNodesByCountryCode(countryCodes[i], EnumStatus.active);
                    assert.ok(result.length > 0, "Get 'active' nodes by country code");
                }
                
                // Get `remove started` nodes
                const did = REMOVE_START_DIDS[0];
                const removedNode = DID_NODE_MAP.get(did.address);
                const removedCountryCode = removedNode.countryCode;
                const result = await blockchainApi.getNodesByCountryCode(removedCountryCode, EnumStatus.removing);
                assert.ok(result.length > 0, "Get 'removing' nodes by country code");
            })
    
            it("Get nodes by region code", async () => {
                const regionArr = nodes.map(item => item.regionCode);
                const regionCodes = [...new Set(regionArr)]
    
                for (let i = 0; i < regionCodes.length; i++) {
                    const regionNodes = nodes.filter(item => item.regionCode === regionCodes[i]);
                    const result = await blockchainApi.getNodesByRegionCode(regionCodes[i]);
    
                    assert.ok(regionNodes.length === result.length, "Get nodes by region code");
                }
            })

            it("Get nodes by region code and status",async () => {
                // Get `active` nodes
                const regionArr = nodes.map(item => item.regionCode);
                const regionCodes = [...new Set(regionArr)]
    
                for (let i = 0; i < regionCodes.length; i++) {
                    const result = await blockchainApi.getNodesByRegionCode(regionCodes[i], EnumStatus.active);
                    assert.ok(result.length > 0, "Get 'active' nodes by region code");
                }

                // Get `remove started` nodes
                const did = REMOVE_START_DIDS[0];
                const removedNode = DID_NODE_MAP.get(did.address);
                const removedregionCode = removedNode.regionCode;
                const result = await blockchainApi.getNodesByRegionCode(removedregionCode, EnumStatus.removing);
                assert.ok(result.length > 0, "Get 'removing' nodes by region code and status");
            })

            it("Get nodes by status", async () => {
                // Get `active` nodes
                let result = await blockchainApi.getNodesByStatus(EnumStatus.active);
                assert.ok(result.length >= REGISTERED_DIDS.length, "Get active nodes");

                // Get `pending removal` nodes
                result = await blockchainApi.getNodesByStatus(EnumStatus.removing);
                assert.ok(result.length > 0, "Get pending removal nodes");

                // Get `removed` nodes
                result = await blockchainApi.getNodesByStatus(EnumStatus.removed);
                assert.ok(result.length >= 0, "Get removed nodes");                
            })
        })
    })
})