const assert = require("assert");
import { Wallet } from 'ethers';
import { EnumStatus, Network } from '@verida/types';
import { DID_NODE_MAP, LOCK_LIST, REGISTERED_DATACENTRES, REGISTERED_DIDS, REGISTERED_LOCK_NODE, REMOVED_DATACENTRES, REMOVE_START_DIDS } from '@verida/vda-common-test';

import { VeridaNodeClient } from '../src/index';
import { BigNumber } from 'ethers';

describe("vda-node-client", () => {
    let blockchainApi: VeridaNodeClient;
    const wallet = Wallet.createRandom();

    before(() => {
        blockchainApi = new VeridaNodeClient(Network.DEVNET);
    })

    describe("Contract information", () => {
        it('getContractDecimal',async () => {
            const result = await blockchainApi.getContractDecimal();
    
            assert.equal(typeof(result), 'number', 'getContractDecimal number');
        })
    
        it('getBalance',async () => {
            const result = await blockchainApi.getBalance(wallet.address);
    
            assert.equal(typeof(result), 'object', 'getBalance object');
        })
    
        it('excessTokenAmount',async () => {
            const result = await blockchainApi.excessTokenAmount(wallet.address);
    
            assert.equal(typeof(result), 'object', 'excessTokenAmount object ');
        })
    })
    

    describe("Data centre", () => {
        it('isRegisteredDataCentreName',async () => {
            const result = await blockchainApi.isRegisteredDataCentreName("InvalidName");
    
            assert.equal(result, false, "False for invalid data centre name");
        })
    
        it('get data centres by ids',async () => {
            // Rejected for invalid ids
            try {
                await blockchainApi.getDataCentresById([1, 0, 2]);
            } catch (e) {
                assert.ok(e !== undefined, "Rejected");
            }
    
            // Success
            const result = await blockchainApi.getDataCentresById([1]);
            assert.equal(typeof(result), 'object', "getDataCentres object");
        })
    
        it('get data centres by name',async () => {
            const names = REGISTERED_DATACENTRES.map((item) => item.name);
    
            // Rejected for invalid ids
            try {
                await blockchainApi.getDataCentresByName(["Invalid", ...names]);
            } catch (e) {
                assert.ok(e !== undefined, "Rejected");
            }
    
            // Success
            const result = await blockchainApi.getDataCentresByName([...names]);
            assert.equal(typeof(result), 'object', "getDataCentresByName object");
        })
    
        it('get data centres by country code and status',async () => {
            const countryList = REGISTERED_DATACENTRES.map(item => item.countryCode);
            const countries = [...new Set(countryList)];
    
            // Get without status
            for (let i = 0; i < countries.length; i++) {
                const result = await blockchainApi.getDataCentresByCountryCode(countries[i]);
                assert.ok(result.length > 0, 'getDataCentresByCountryCode array');
            }
    
            // Get with status
            const removedCountryCode = REMOVED_DATACENTRES[0].countryCode;
            const result = await blockchainApi.getDataCentresByCountryCode(removedCountryCode, EnumStatus.removed);
            
            assert.ok(result.length > 0, 'Get removed datacentres');
        })
    
        
        it('get data centres by region code and status',async () => {
            const regionList = REGISTERED_DATACENTRES.map(item => item.regionCode);
            const regions = [...new Set(regionList)];
    
            // Get without status
            for (let i = 0; i < regions.length; i++) {
                const result = await blockchainApi.getDataCentresByRegionCode(regions[i]);
                assert.ok(result.length > 0, 'getDataCentresByRegionCode array');
            }
    
            // Get with status
            const removedRegionCode = REMOVED_DATACENTRES[0].regionCode;
            const result = await blockchainApi.getDataCentresByRegionCode(removedRegionCode, EnumStatus.removed);
            assert.ok(result.length > 0, 'Get removed datacentres');
        })
    })

    describe("Log information", () => {
        it('getNodeIssueFee',async () => {
            const result: BigNumber = await blockchainApi.getNodeIssueFee();
    
            assert.ok(result.gt(0), 'Logging node issue fee is always greater than 0')
        })
    
        it('getSameNodeLogDuration',async () => {
            const result: BigNumber = await blockchainApi.getSameNodeLogDuration();
    
            assert.ok(result.gt(0), 'Log duration for same node is always greater than 0')
        })
    
        it('getLogLimitPerDay',async () => {
            const result: BigNumber = await blockchainApi.getLogLimitPerDay();
    
            assert.ok(result.gt(0), 'Log limit per day is always greater than 0')
        })
    
        it('getReasonCodeList',async () => {
            const result = await blockchainApi.getReasonCodeList();
    
            assert.ok(result.length > 0, 'Get reason code list')
        })
    
        it('getReasonCodeDescription',async () => {
            const reasonCodeList = await blockchainApi.getReasonCodeList();
    
            const description = await blockchainApi.getReasonCodeDescription(reasonCodeList[0].reasonCode);
            assert.ok(typeof(description) === 'string', 'Get description of reason code')
        })
    })

    describe("Get nodes", () => {
        let registeredNodes: any[] = [];
        before(() => {
            DID_NODE_MAP.forEach((value) => registeredNodes.push(value))
        })

        it('isRegisteredNodeName',async () => {
            let result = await blockchainApi.isRegisteredNodeName("InvalidName");
            assert.ok(result === false, 'false for unregistered name');

            result = await blockchainApi.isRegisteredNodeName(registeredNodes[0].name);
            assert.ok(result === true, 'true for registered name');
        })

        it('isRegisteredNodeAddress',async () => {
            let result = await blockchainApi.isRegisteredNodeAddress(Wallet.createRandom().address);
            assert.ok(result === false, 'false for unregistered address');

            const wallet = new Wallet(REGISTERED_DIDS[0].privateKey);
            result = await blockchainApi.isRegisteredNodeAddress(wallet.address);
            assert.ok(result === true, 'true for registered address');
        })

        it('isRegisteredNodeEndpoint',async () => {
            let result = await blockchainApi.isRegisteredNodeEndpoint("https://invalid-uri");
            assert.ok(result === false, 'false for unregistered uri');

            result = await blockchainApi.isRegisteredNodeEndpoint(registeredNodes[0].endpointUri);
            assert.ok(result === true, 'true for registered uri');
        })

        it('getNodeByName',async () => {
            // Rejected for unregistered name
            let result
            try {
                result = await blockchainApi.getNodeByName('InvalidName');
            } catch (e) {
                assert.ok(true, 'Rejected for unregistered name');
            }
            
            // Return a node for registered name
            result = await blockchainApi.getNodeByName(registeredNodes[0].name);
            assert.equal(typeof(result), 'object', 'Returned a node for registered DID address');
        })

        it('getNodeByAddress',async () => {
            // Rejected for unregistered DID address
            let result
            try {
                result = await blockchainApi.getNodeByAddress(Wallet.createRandom().address);
            } catch (e) {
                assert.ok(true, 'Rejected for unregistered address');
            }
            
            // Return a node for registered DID address
            const did = new Wallet(REGISTERED_DIDS[0].privateKey);
            result = await blockchainApi.getNodeByAddress(did.address);
            assert.equal(typeof(result), 'object', 'Returned a node for registered DID address');
        })

        it('getNodeByEndpoint',async () => {
            // Rejected for unregistered endpoint URI
            let result
            try {
                result = await blockchainApi.getNodeByEndpoint(`https://${Wallet.createRandom().address}`);
            } catch (e) {
                assert.ok(true, 'Rejected for unregistered address');
            }
            
            // Return a node for registered DID address
            result = await blockchainApi.getNodeByEndpoint(registeredNodes[0].endpointUri);
            assert.equal(typeof(result), 'object', 'Returned a node for registered DID address');
        })

        it('getNodesByCountryCode',async () => {
            const counrtryList: any[] = [];
            DID_NODE_MAP.forEach((node) => {
                counrtryList.push(node.countryCode);
            });
            const countries = [...new Set(counrtryList)];

            for (let i = 0; i < countries.length; i++) {
                const result = await blockchainApi.getNodesByCountryCode(countries[i], 10, 1);
                assert.ok(result.length > 0, "Return 1 or more nodes for registered country code");
            }
        })

        it('getNodesByCountryCodeAndStatus',async () => {
            const removingCountryCode = (DID_NODE_MAP.get(REMOVE_START_DIDS[0].address)).countryCode;
            const result = await blockchainApi.getNodesByCountryCode(removingCountryCode, 10, 1, EnumStatus.removing);
            assert.ok(result.length > 0, "Return 1 or more removing nodes for registered country code");
        })

        it('getNodesByRegionCode',async () => {
            const regionList: any[] = [];
            DID_NODE_MAP.forEach((node) => {
                regionList.push(node.regionCode);
            });
            const regions = [...new Set(regionList)];

            for (let i = 0; i < regions.length; i++) {
                const result = await blockchainApi.getNodesByRegionCode(regions[i], 10, 1);
                assert.ok(result.length > 0, "Return 1 or more nodes for registered region code");
            }
        })

        it('getNodesByRegionCodeAndStatus',async () => {
            const removingRegioinCode = (DID_NODE_MAP.get(REMOVE_START_DIDS[0].address)).regionCode;
            const result = await blockchainApi.getNodesByRegionCode(removingRegioinCode, 10, 1, EnumStatus.removing);
            assert.ok(result.length > 0, "Return 1 or more removing nodes for registered country code");
        })

        it("getNodesByStatus", async () => {
            let result = await blockchainApi.getNodesByStatus(EnumStatus.active, 10, 1);
            assert.ok(result.length > 0, "Return 1 or more active nodes");

            result = await blockchainApi.getNodesByStatus(EnumStatus.removing, 10, 1);
            assert.ok(result.length > 0, "Return 1 or more pending removal nodes");

            result = await blockchainApi.getNodesByStatus(EnumStatus.removed, 10, 1);
            assert.ok(result.length >= 0, "Return 0 or more active nodes");
        })
    })

    describe("Stake information", () => {
        it('isStakingRequired',async () => {
            const result = await blockchainApi.isStakingRequired();
            assert.equal(typeof(result), 'boolean', `isStakingRequired return boolean`);
        })
    
        it('getStakePerSlot',async () => {
            const result: BigNumber = await blockchainApi.getStakePerSlot();
            assert.ok(result.gt(0), 'Stake per slot is always greater than 0');
        })
    
        it('getSlotCountRange',async () => {
            const result = await blockchainApi.getSlotCountRange();
            assert.equal(typeof(result), 'object', `SlotCountRange is object`);
        })
    
        it('isWithdrawalEnabled',async () => {
            const result = await blockchainApi.isWithdrawalEnabled();
            assert.equal(typeof(result), 'boolean', `isWithdrawalEnabled return boolean`);
        })
    })

    describe('Lock information', () => {
        const lockDIDAddress = new Wallet(REGISTERED_LOCK_NODE.privateKey).address;
        it('locked', async () => {
            for (let lockInfo of LOCK_LIST) {
                const result = await blockchainApi.locked(lockDIDAddress, lockInfo.purpose) as BigNumber;
                assert.equal(typeof(result), 'object', 'Get locked amount');
            }
        })

        it('getLocks', async () => {
            const result = await blockchainApi.getLocks(lockDIDAddress, 10, 1);
            assert.ok(result.length >= 0, 'Get lock information list');
        })
    })
})

