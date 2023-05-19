require('dotenv').config();
import { VeridaNodeClient } from "../src/index"
import { EnvironmentType } from "@verida/types";
import { REGISTERED_NODES, REGISTERED_USERS, compareNodeData } from "./const";

const assert = require('assert')

const createBlockchainAPI = () => {
    return new VeridaNodeClient({
        network: EnvironmentType.TESTNET
    })
}

describe('vda-node-client read only tests', () => {
    let blockchainApi : VeridaNodeClient
    before(() => {
        blockchainApi = createBlockchainAPI()
    })

    describe('Get data centers', () => {
        const unregisteredCountry = ['sg', 'al'];
        const registeredCountry = ['us', 'uk'];
        const registeredRegion = ['north america', 'europe'];

        it('Get data centers by ids',async () => {
            const validIdGroup = [
                [3],
                [1,2],
                [1,2,3]
            ]

            for (let i = 0; i < validIdGroup.length; i++ ){
                const result = await blockchainApi.getDataCenters(validIdGroup[i]);
                assert.ok(result.length === validIdGroup[i].length, 'Get same length data centers');
            }
        })

        it('Get data centers by country', async () => {
            // Empty array for unregistered countries
            for (let i = 0; i < unregisteredCountry.length; i++) {
                const result = await blockchainApi.getDataCentersByCountry(unregisteredCountry[i]);
                assert.deepEqual(result, [], 'Get empty array');
            }

            // Get result for registered countries
            for (let i = 0; i < registeredCountry.length; i++) {
                const result = await blockchainApi.getDataCentersByCountry(registeredCountry[i]);
                assert.ok(result.length > 0, "Got successfully");
            }
        })

        it ('Get data centers by region', async () => {
            // Empty array for unregistered regions            
            const unregisteredRegionCodes = [
                "asia",
                "africa"
            ]
            for (let i = 0; i < unregisteredRegionCodes.length; i++) {
                const result = await blockchainApi.getDataCentersByRegion(unregisteredRegionCodes[i]);
                assert.deepEqual(result, [], 'Get empty array');
            }

            // Get result for registered regions
            for (let i = 0; i < registeredRegion.length; i++) {
                const result = await blockchainApi.getDataCentersByRegion(registeredRegion[i]);
                assert.ok(result.length > 0, "Got successfully");
            }
        })
    })

    describe('Get storage node', async () => {
        const nodes = [...REGISTERED_NODES];
        const users = [...REGISTERED_USERS];

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

        it("Get nodes by country", async () => {
            const codeArr = nodes.map(item => item.countryCode);
            const countryCodes = [...new Set(codeArr)]

            for (let i = 0; i < countryCodes.length; i++) {
                const countryNodes = nodes.filter(item => item.countryCode === countryCodes[i]);
                const result = await blockchainApi.getNodesByCountry(countryCodes[i]);

                assert.ok(countryNodes.length === result.length, "Get nodes by country code");
            }
        })

        it("Get nodes by region", async () => {
            const regionArr = nodes.map(item => item.regionCode);
            const regionCodes = [...new Set(regionArr)]

            for (let i = 0; i < regionCodes.length; i++) {
                const regionNodes = nodes.filter(item => item.regionCode === regionCodes[i]);
                const result = await blockchainApi.getNodesByRegion(regionCodes[i]);

                assert.ok(regionNodes.length === result.length, "Get nodes by region code");
            }
        })
    })
})