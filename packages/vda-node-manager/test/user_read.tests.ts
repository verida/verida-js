require('dotenv').config();
import { VeridaNodeManager } from "../src/index"
import { EnvironmentType } from "@verida/types";
import { BigNumber, Wallet } from 'ethers';
import { addInitialData, compareNodeData } from "./helpers";
import { REGISTERED_DIDS, DID_NODE_MAP, getBlockchainAPIConfiguration } from "@verida/vda-common-test";

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
    let registeredCenterIds : BigNumber[] = [];
    let blockchainApi : VeridaNodeManager

    before(async () => {
        registeredCenterIds = await addInitialData(configuration);
        blockchainApi = createBlockchainAPI()
    })

    describe('Get data centers', () => {
        const unregisteredCountry = ['sg', 'al'];
        const registeredCountry = ['us', 'uk'];
        const registeredRegion = ['north america', 'europe'];

        it('Get data centers by ids',async () => {
            const validIdGroup = [...registeredCenterIds]
            const result = await blockchainApi.getDataCenters(validIdGroup);
            assert.ok(result.length === validIdGroup.length, 'Get same length data centers');
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
        let nodes: any[]  = [];
        let users: Wallet[]= [];

        before(() => {
            users = REGISTERED_DIDS.map((item) => new Wallet(item.privateKey));
            DID_NODE_MAP.forEach((value) => {
                nodes.push(value);
            })
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