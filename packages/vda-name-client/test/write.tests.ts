require('dotenv').config();
import { dids, getBlockchainAPIConfiguration } from "./utils"
import { VeridaNameClient } from "../src/index"
import { Wallet } from "ethers";
import { EnvironmentType } from "@verida/types";

const assert = require('assert')

const did = dids[0];
const unregisteredDID = dids[1];

const testNames = [
    'helloworld.vda',
    'hello----world--.vda',
    'hello_world-dave.vda',
    'JerrySmith.vda',
    'JerrySmith.test',
    'Billy.test',
];
  

const configuration = getBlockchainAPIConfiguration();
const createBlockchainAPI = (did: any) => {
    return new VeridaNameClient({
        did: did.address,
        signKey: did.privateKey,
        network: EnvironmentType.TESTNET,
        ...configuration
    })
}

describe('vda-name-client read and write tests', () => {
    let blockchainApi : VeridaNameClient
    before(() => {
        blockchainApi = createBlockchainAPI(did);
        did.address = did.address.toLowerCase()
    })

    describe('register', function() {
        this.timeout(60*1000)
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
            for (let i = 0; i < 3; i++) {
                await blockchainApi.register(testNames[i])

                const nameDID = await blockchainApi.getDID(testNames[i])
                assert.equal(nameDID, did.address, 'Get registered DID')
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
        this.timeout(60*1000)
        it('Get usernames successfully', async () => {
            const usernames = await blockchainApi.getUsernames(did.address);
            assert.deepEqual(
                usernames, 
                [testNames[0], testNames[1], testNames[2]], 
                'Get registered usernames');
        })

        it('Should reject for unregistered DID',async () => {
            const usernames = await blockchainApi.getUsernames(unregisteredDID.address)
            assert.deepEqual(usernames, [], 'Usernames are empty')
        })
    })

    describe('Get DID', function() {
        this.timeout(60*1000)
        it('Get DID successfully', async () => {
            for (let i = 0; i < 3; i++) {
                const foundDID = await blockchainApi.getDID(testNames[i])

                assert.equal(
                    foundDID,
                    did.address,
                    'Get registered DID'
                )
            }
        })

        it('Should reject for unregistered usernames', async () => {
            try {
                const result = await blockchainApi.getDID(testNames[3])
                assert.fail('Username incorrectly fetched')
            } catch (err) {
                assert.ok(err.message.match('Failed to locate the DID'), 'Fail to get the DID')
            }
        })
    })

    describe('Unregister', function() {
        this.timeout(60*1000)
        it('Should reject for unregistered names', async () => {
            await assert.rejects(
                blockchainApi.unregister(testNames[3]),
                {message: `Failed to unregister username: ${testNames[3]} (Unregistered name)`}
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
            for (let i = 0; i < 3; i++) {
                await blockchainApi.unregister(testNames[i])
            }

            const usernames = await blockchainApi.getUsernames(did.address)
            assert.deepEqual(usernames, [], 'Usernames are empty')
        })
    })
})