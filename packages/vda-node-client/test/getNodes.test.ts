const assert = require("assert");
import { BigNumber, Wallet } from 'ethers';
import { getNodeByAddress, getNodeByEndpoint, getNodesByCountry, getNodesByRegion } from '../src/getNodes';
import { REGISTERED_DIDS, DID_NODE_MAP } from '@verida/vda-common-test';

const NETWORK = 'testnet';

describe('getNodes test', function() {
    this.timeout(20000);

    it('getNodeByAddress',async () => {
        // Return `undefined` for unregistered DID address
        let result = await getNodeByAddress(NETWORK, Wallet.createRandom().address);
        assert.equal(result, undefined, `Return 'undefined' for unregistered DID address`);

        // Return a node for registered DID address
        const did = new Wallet(REGISTERED_DIDS[0].privateKey);
        result = await getNodeByAddress(NETWORK, did.address);
        assert.equal(typeof(result), 'object', 'Returned a node for registered DID address');
    })

    it('getNodeByEndpoint',async () => {
        // Return `undefined` for unregistered endpointURI
        let result = await getNodeByEndpoint(NETWORK, `https://${Wallet.createRandom().address}`);
        assert.equal(result, undefined, `Return 'undefined' for unregistered endpointURI`);

        const registeredNode = DID_NODE_MAP.get(REGISTERED_DIDS[0].address);
        result = await getNodeByEndpoint(NETWORK, registeredNode.endpointUri);
        assert.equal(typeof(result), 'object', 'Returned a node for registered endpointURI');
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
})