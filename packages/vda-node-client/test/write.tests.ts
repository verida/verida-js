require('dotenv').config();
import { DID_LIST, getBlockchainAPIConfiguration, sleep, TRUSTED_SIGNER } from "@verida/vda-common-test"
import { VeridaNodeClient } from "../src/index"
import { Wallet, ethers } from "ethers";
import { EnvironmentType } from "@verida/types";
import { REGISTERED_NODES, REGISTERED_USERS, compareNodeData } from "./const";

import EncryptionUtils from "@verida/encryption-utils";

const assert = require('assert')

const privateKey = process.env.PRIVATE_KEY
if (!privateKey) {
    throw new Error('No PRIVATE_KEY in the env file');
}

const configuration = getBlockchainAPIConfiguration(privateKey);
const createBlockchainAPI = (did: any) => {
    return new VeridaNodeClient({
        did: did.address,
        signKey: did.privateKey,
        network: EnvironmentType.TESTNET,
        ...configuration
    })
}

const generateAuthSignature = (user: Wallet, signer: Wallet) => {
    const authMsg = ethers.utils.solidityPack(
        ['address'],
        [user.address]
    )
    const signerKeyBuffer = new Uint8Array(Buffer.from(signer.privateKey.slice(2), 'hex'));
    return EncryptionUtils.signData(authMsg, signerKeyBuffer);
}

describe('vda-node-client read and write tests', () => {
    

    const invalidCountryCodes = ['aYs', 'US', '']; //['AUS', 'A', '', 'ABC'];
    const invalidRegionCodes = [
        "",                 // Empty code
        "North America",    // Capital letter in the code
    ]

    describe('Get data centers', () => {
        let blockchainApi : VeridaNodeClient;

        const did = DID_LIST[0];

        const unregisteredCountry = ['sg', 'al'];
        const registeredCountry = ['us', 'uk'];
        const registeredRegion = ['north america', 'europe'];

        before(() => {
            blockchainApi = createBlockchainAPI(did);
            did.address = did.address.toLowerCase()
        })

        describe('Get data centers by ID', () => {
            it('Should reject for invalid data center ids', async () => {
                const invalidIdGroup = [
                    [1, 2, 4, 5],
                    [3, 5],
                    [3],
                    [4]
                ]
                for (let i = 0; i < invalidIdGroup.length; i++ ){
                    try {
                        await blockchainApi.getDataCenters(invalidIdGroup[i]);
                    } catch (err) {
                        assert.ok(err.message.match('Failed to get datacenters'), 'Failed');
                    }
                }
            })

            it('Get data centers by ids successfully', async () => {
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
        let blockchainApi : VeridaNodeClient;
        const signer = new Wallet(TRUSTED_SIGNER.privateKey);
        const user =  Wallet.createRandom();
        const newNode = {
            endpointUri: 'https://' + user.address,
            countryCode: 'to',
            regionCode: 'oceania',
            datacenterId: 1,
            lat: 21.143,
            long: -175.0742
        };

        // const did = user.address;

        before(() => {
            blockchainApi = createBlockchainAPI({
                address: `did:vda:testnet:${user.address}`,
                privateKey: user.privateKey
            });
        })

        describe('Add Node', () => {
            it("Failed: Empty endpoint uri", async () => {
                try {
                    await blockchainApi.addNode("", "", "", 0, 0, 0, "0x00");
                } catch (err) {
                    assert.ok(err.message.match('Failed to add node'));
                }
            })

            it("Failed: Invalid country codes", async () => {
                for (let i = 0; i < invalidCountryCodes.length; i++) {
                    try {
                        await blockchainApi.addNode("https://1", invalidCountryCodes[i], "", 0, 0, 0, "0x00");
                    } catch (err) {
                        assert.ok(err.message.match('Failed to add node'));
                    }
                }
            })

            it("Failed: Invalid region codes", async () => {
                for (let i = 0; i < invalidRegionCodes.length; i++) {
                    try {
                        await blockchainApi.addNode("https://1", "us", invalidRegionCodes[i], 0, 0, 0, "0x00");
                    } catch (err) {
                        assert.ok(err.message.match('Failed to add node'));
                    }
                }
            })

            it("Failed: Invalid datacenterID", async () => {
                const invalidDatacenterIds = [0, 10000];

                for (let i = 0; i < invalidDatacenterIds.length; i++) {
                    try {
                        await blockchainApi.addNode("https://1", "us", "north america", invalidDatacenterIds[i], 0, 0, "0x00");
                    } catch (err) {
                        assert.ok(err.message.match('Failed to add node'));
                    }
                }
            })

            it("Failed: Invlaid Latitude",async () => {
                const invalidLatValues = [-90.05, 91];
                for (let i = 0; i < invalidLatValues.length; i++) {
                    try {
                        await blockchainApi.addNode("https://1", "us", "north america", 1, invalidLatValues[i], 0, "0x00");
                    } catch (err) {
                        assert.ok(err.message.match('Failed to add node'));
                    }
                }
            })

            it("Failed: Invalid Longitude",async () => {
                const invalidLongValues = [-180.1, 181];
                for (let i = 0; i < invalidLongValues.length; i++) {
                    try {
                        await blockchainApi.addNode("https://1", "us", "north america", 1, 0, invalidLongValues[i], "0x00");
                    } catch (err) {
                        assert.ok(err.message.match('Failed to add node'));
                    }
                }
            })
            
            it("Failed: Invalid auth signature",async () => {
                const badSigner = Wallet.createRandom();

                const badSignature = generateAuthSignature(user, badSigner);

                try {
                    await blockchainApi.addNode("https://1", "us", "north america", 1, 0, 0, badSignature);
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
                        authSignature
                    );

                    await sleep(1000);

                    const result = await blockchainApi.getNodeByAddress();
                    assert.ok(compareNodeData(newNode, result));
                } catch (err) {
                    console.log(err);
                    throw new Error(err);
                }
            })   
        })
    
        describe('Get Nodes', () => {
            const nodes = [...REGISTERED_NODES];
            const users = [...REGISTERED_USERS];

            before(() => {
                nodes.push(newNode);
                users.push(user);
            })

            it("Get node by address", async () => {
                const selfNode = await blockchainApi.getNodeByAddress();
                assert.ok(compareNodeData(newNode, selfNode), "Get node by address");

                const others = await blockchainApi.getNodeByAddress(users[0].address);
                assert.ok(compareNodeData(nodes[0], others), "Get node by address");
            })

            it("Get node by endpoint", async () => {
                const result = await blockchainApi.getNodeByEndpoint(newNode.endpointUri);
                assert.ok(compareNodeData(newNode, result), "Get node by address");
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

                    let node = await blockchainApi.getNodeByAddress();
                    assert.ok(node.status === 'active', 'Node is active');

                    // RemoveNode start
                    await blockchainApi.removeNodeStart(unregisterTime);

                    node = await blockchainApi.getNodeByAddress();
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