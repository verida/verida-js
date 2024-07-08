require('dotenv').config();
import { DID_LIST, getBlockchainAPIConfiguration } from "@verida/vda-common-test"
import { VeridaNameClient } from "../src/index"
import { Wallet } from "ethers";
import { BlockchainAnchor } from "@verida/types";

const assert = require('assert')

const did = DID_LIST[0];
const unregisteredDID = DID_LIST[1];

const testNames = [
    'helloworld.vda',
    'hello----world--.vda',
    'hello_world-dave.vda',
    'JerrySmith.vda',
    'JerrySmith.test',
    'Billy.test',
];

const privateKey = process.env.PRIVATE_KEY
if (!privateKey) {
    throw new Error('No PRIVATE_KEY in the env file');
}

const configuration = getBlockchainAPIConfiguration(privateKey);
const createBlockchainAPI = (did: any) => {
    return new VeridaNameClient({
        blockchainAnchor: BlockchainAnchor.POLAMOY,
        did: did.address,
        signKey: did.privateKey,
        ...configuration
    })
}

describe('vda-name-client read and write tests', function() {
    this.timeout(200*1000)

    let blockchainApi : VeridaNameClient;
    const REGISTER_COUNT = 2;

    before(async () => {
        blockchainApi = createBlockchainAPI(did);
        did.address = did.address.toLowerCase()

        const maxLimit = Number(await blockchainApi.getNameLimitPerDID());
        console.log("NameLimit : ", maxLimit);
        if (REGISTER_COUNT > maxLimit) {
            throw new Error(`Can register up to ${maxLimit} names per DID`);
        }
    })

    describe('register', function() {
        it('Should reject for invalid names', async () => {
            const invalidnames = [
                'hello world.vda',   // Space in the name 
                'hello!world.vda',   // ! in the name
                'david.test.vda',    // More than one dot in the name
                'Jerry.test',           // Unregistered suffix
                'a.vda',             // Name leng should be over 1
                'abcdefghijklmnopqrstuvwxyz0123456.vda', // Name length should be below 33
            ]
            for (let i = 0; i < invalidnames.length; i++) {
                try {
                    const result = await blockchainApi.register(invalidnames[i])
                    assert.fail('Fail to register invalid name')
                } catch (err) {
                    assert.ok(err.message.match('Failed to register'), 'Fail to register invalid name')
                }
            }
        })
        
        it('Register successfully', async () => {
            for (let i = 0; i < REGISTER_COUNT; i++) {
                await blockchainApi.register(testNames[i])

                const nameDID = await blockchainApi.getDID(testNames[i])
                assert.equal(nameDID.toLowerCase(), did.address.toLowerCase(), 'Get registered DID')
            }
        })

        it('Should reject for registered name', async () => {
            try {
                const result = await blockchainApi.register(testNames[0])
                assert.fail('Fail to register invalid name')
            } catch (err) {
                assert.ok(err.message.match('Failed to register'), 'Fail to register invalid name')
            }
        })
    })

    describe('Get usernames', function() {
        it('Get usernames successfully', async () => {
            const usernames = await blockchainApi.getUsernames(did.address);
            const expectedNames : string[] = []
            for (let i = 0; i < REGISTER_COUNT; i++) {
                expectedNames.push(testNames[i].toLowerCase())
            }
            assert.deepEqual(
                usernames, 
                expectedNames,
                'Get registered usernames');
        })

        it('Should reject for unregistered DID',async () => {
            const usernames = await blockchainApi.getUsernames(unregisteredDID.address)
            assert.deepEqual(usernames, [], 'Usernames are empty')
        })
    })

    describe('Get DID', function() {
        it('Get DID successfully', async () => {
            for (let i = 0; i < REGISTER_COUNT; i++) {
                const foundDID = await blockchainApi.getDID(testNames[i])

                assert.equal(
                    foundDID.toLowerCase(),
                    did.address.toLowerCase(),
                    'Get registered DID'
                )
            }
        })

        it('Should reject for unregistered usernames', async () => {
            try {
                const result = await blockchainApi.getDID(testNames[4])
                assert.fail('Username incorrectly fetched')
            } catch (err) {
                assert.ok(err.message.match('Failed to locate the DID'), 'Fail to get the DID')
            }
        })
    })

    describe('Unregister', function() {
        it('Should reject for unregistered names', async () => {
            await assert.rejects(
                blockchainApi.unregister(testNames[4]),
                {message: `Failed to unregister username: ${testNames[4].toLowerCase()} (execution reverted)`}
            )
        })

        it('Should reject for unregistered DID', async () => {
            const testDID = Wallet.createRandom()
            const testAPI = createBlockchainAPI(`did:vda:testnet:${testDID}`)

            await assert.rejects(
                testAPI.unregister(testNames[0]),
                {message: 'Unable to submit to blockchain. In read only mode.'}
            )
        })

        it('Unregister successfully', async () => {
            for (let i = 0; i < REGISTER_COUNT; i++) {
                await blockchainApi.unregister(testNames[i])
            }

            const usernames = await blockchainApi.getUsernames(did.address)
            await assert.deepEqual(usernames, [], 'Usernames are empty')
        })
    })
})