const assert = require("assert");
import { BigNumber, Wallet } from 'ethers';
import { getNodeByAddress, getNodeByEndpoint, getNodeByName, getNodesByCountry, getNodesByRegion, isRegisteredNodeAddress, isRegisteredNodeEndpoint, isRegisteredNodeName } from '../src/getNodes';
import { REGISTERED_DIDS, DID_NODE_MAP, REMOVE_START_DIDS } from '@verida/vda-common-test';
import { EnumStatus } from '@verida/types';

const NETWORK = 'testnet';

describe('getNodes test', function() {
    this.timeout(20000);

    let registeredNodes: any[] = [];
    before(() => {
        DID_NODE_MAP.forEach((value) => registeredNodes.push(value))
    })

    it('isRegisteredNodeName',async () => {
        let result = await isRegisteredNodeName(NETWORK, "InvalidName");
        assert.ok(result === false, 'false for unregistered name');

        result = await isRegisteredNodeName(NETWORK, registeredNodes[0].name);
        assert.ok(result === true, 'true for registered name');
    })

    it('isRegisteredNodeAddress',async () => {
        let result = await isRegisteredNodeAddress(NETWORK, Wallet.createRandom().address);
        assert.ok(result === false, 'false for unregistered address');

        const wallet = new Wallet(REGISTERED_DIDS[0].privateKey);
        result = await isRegisteredNodeAddress(NETWORK, wallet.address);
        assert.ok(result === true, 'true for registered address');
    })

    it('isRegisteredNodeEndpoint',async () => {
        let result = await isRegisteredNodeEndpoint(NETWORK, "https://invalid-uri");
        assert.ok(result === false, 'false for unregistered uri');

        result = await isRegisteredNodeEndpoint(NETWORK, registeredNodes[0].endpointUri);
        assert.ok(result === true, 'true for registered uri');
    })

    it('getNodeByName',async () => {
        // Rejected for unregistered name
        let result
        try {
            result = await getNodeByName(NETWORK, 'InvalidName');
        } catch (e) {
            assert.ok(true, 'Rejected for unregistered name');
        }
        
        // Return a node for registered name
        result = await getNodeByName(NETWORK, registeredNodes[0].name);
        assert.equal(typeof(result), 'object', 'Returned a node for registered DID address');
    })

    it('getNodeByAddress',async () => {
        // Rejected for unregistered DID address
        let result
        try {
            result = await getNodeByAddress(NETWORK, Wallet.createRandom().address);
        } catch (e) {
            assert.ok(true, 'Rejected for unregistered address');
        }
        
        // Return a node for registered DID address
        const did = new Wallet(REGISTERED_DIDS[0].privateKey);
        result = await getNodeByAddress(NETWORK, did.address);
        assert.equal(typeof(result), 'object', 'Returned a node for registered DID address');
    })

    it('getNodeByEndpoint',async () => {
        // Rejected for unregistered endpoint URI
        let result
        try {
            result = await getNodeByEndpoint(NETWORK, `https://${Wallet.createRandom().address}`);
        } catch (e) {
            assert.ok(true, 'Rejected for unregistered address');
        }
        
        // Return a node for registered DID address
        result = await getNodeByEndpoint(NETWORK, registeredNodes[0].endpointUri);
        assert.equal(typeof(result), 'object', 'Returned a node for registered DID address');
    })

    it('getNodesByCountry',async () => {
        const counrtryList: any[] = [];
        DID_NODE_MAP.forEach((node) => {
            counrtryList.push(node.countryCode);
        });
        const countries = [...new Set(counrtryList)];

        for (let i = 0; i < countries.length; i++) {
            const result = await getNodesByCountry(NETWORK, countries[i]);
            assert.ok(result.length > 0, "Return 1 or more nodes for registered country code");
        }
    })

    it('getNodesByCountryAndStatus',async () => {
        const removedCountryCode = (DID_NODE_MAP.get(REMOVE_START_DIDS[0].address)).countryCode;
        const result = await getNodesByCountry(NETWORK, removedCountryCode, EnumStatus.removing);
        assert.ok(result.length > 0, "Return 1 or more removing nodes for registered country code");
    })

    it('getNodesByRegion',async () => {
        const regionList: any[] = [];
        DID_NODE_MAP.forEach((node) => {
            regionList.push(node.regionCode);
        });
        const regions = [...new Set(regionList)];

        for (let i = 0; i < regions.length; i++) {
            const result = await getNodesByRegion(NETWORK, regions[i]);
            assert.ok(result.length > 0, "Return 1 or more nodes for registered region code");
        }
    })

    it('getNodesByCountryAndStatus',async () => {
        const removedRegioinCode = (DID_NODE_MAP.get(REMOVE_START_DIDS[0].address)).regionCode;
        const result = await getNodesByRegion(NETWORK, removedRegioinCode, EnumStatus.removing);
        assert.ok(result.length > 0, "Return 1 or more removing nodes for registered country code");
    })

})