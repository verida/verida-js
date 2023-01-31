require('dotenv').config();
import { dids, getBlockchainAPIConfiguration } from "./utils"
import BlockchainApi from "../src/blockchain/blockchainApi"
import { Wallet } from "ethers";

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
    return new BlockchainApi({
        identifier: did.address,
        signKey: did.privateKey,
        chainNameOrId: "testnet",
        ...configuration
    })
}

describe('vda-name-client blockchain api', () => {
    let blockchainApi : BlockchainApi
    before(() => {
        blockchainApi = createBlockchainAPI(did);
    })

    describe('register', () => {
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
                await assert.rejects(
                    blockchainApi.register(invalidnames[i]),
                    {message: 'Failed to register'}
                )
            }
        })

        it('Register successfully', async () => {
            for (let i = 0; i < 3; i++) {
                await blockchainApi.register(testNames[i])

                const nameDID = await blockchainApi.getDid(testNames[i])
                assert.equal(nameDID, did.address, 'Get registered DID')
            }
        })

        it('Should reject for registered name', async () => {
            await assert.rejects(
                blockchainApi.register(testNames[0]),
                {message: 'Failed to register'}
            )
        })
    })

    describe('Get usernames', () => {
        it('Get usernames successfully', async () => {
            const usernames = await blockchainApi.getUsernames(did.address);
            assert.deepEqual(
                usernames, 
                [testNames[0], testNames[1], testNames[2]], 
                'Get registered usernames');
        })

        it('Should reject for unregistered DID',async () => {
            await assert.rejects(
                blockchainApi.getUsernames(unregisteredDID.address),
                {message: 'Failed to get usernames'}
            )
        })
    })

    describe('Get DID', () => {
        it('Get DID successfully', async () => {
            for (let i = 0; i < 3; i++) {
                const foundDID = await blockchainApi.getDid(testNames[i])

                assert.equal(
                    foundDID,
                    did.address,
                    'Get registered DID'
                )
            }
        })

        it('Should reject for unregistered usernames', async () => {
            await assert.rejects(
                blockchainApi.getDid(testNames[3]),
                {message: 'Failed to get the DID'}
            )
        })
    })

    describe('Unregister', () => {
        it('Should reject for unregistered names', async () => {
            await assert.rejects(
                blockchainApi.unregister(testNames[3]),
                {message: 'Failed to unregister'}
            )
        })

        it('Should reject for unregistered DID', async () => {
            const testDID = Wallet.createRandom()
            const testAPI = createBlockchainAPI(testDID)

            await assert.rejects(
                testAPI.unregister(testNames[0]),
                {message: 'Failed to unregister'}
            )
        })

        it('Unregister successfully', async () => {
            for (let i = 0; i < 3; i++) {
                await blockchainApi.unregister(testNames[i])
            }

            await assert.rejects(
                blockchainApi.getUsernames(did.address),
                {message: 'Failed to get usernames'}
            )
        })
    })
})