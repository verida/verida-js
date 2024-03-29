const assert = require('assert')
import BlockchainApi from "../src/blockchain/blockchainApi"
import { Wallet } from "ethers";
import { VdaDidConfigurationOptions } from '@verida/types';
require('dotenv').config();

const did = Wallet.createRandom();

const endPoints_A = ['https://A_1', 'https://A_2', 'https://A_3'];
const endPoints_B = ['https://B_1', 'https://B_2'];
const endPoints_Empty: string[] = [];

const privateKey = process.env.PRIVATE_KEY;
if (!privateKey) {
    throw new Error('No PRIVATE_KEY in the env file');
}

const rpcUrl = process.env.RPC_URL;
if (!rpcUrl) {
    throw new Error('No RPC_URL in the env file');
}


const configuration = {
    callType: 'web3',
    web3Options: {
        privateKey,
        rpcUrl,
        eip1559Mode: 'fast',
        eip1559gasStationUrl: 'https://gasstation-testnet.polygon.technology/v2'
    }
  }

const createBlockchainAPI = (did: any) => {
    return new BlockchainApi(<VdaDidConfigurationOptions>{
        identifier: did.address,
        signKey: did.privateKey,
        chainNameOrId: "testnet",
        ...configuration
    })
}

describe('vda-did blockchain api', () => {
    let blockchainApi : BlockchainApi
    before(() => {
        blockchainApi = createBlockchainAPI(did);
    })

    describe('register', function() {
        this.timeout(100 * 1000)

        it.only('Register successfully', async () => {
            await blockchainApi.register(endPoints_A);

            const lookupResult = await blockchainApi.lookup(did.address);
            assert.deepEqual(
                lookupResult, 
                {didController: did.address, endpoints: endPoints_A},
                'Get same endpoints');
        })

        it('Should update for registered DID', async () => {
            await blockchainApi.register(endPoints_B);

            const lookupResult = await blockchainApi.lookup(did.address);
            assert.deepEqual(
                lookupResult, 
                {didController: did.address, endpoints: endPoints_B}, 
                'Get updated endpoints');
        })

        it('Should reject for revoked did', async () => {
            const tempDID = Wallet.createRandom();
            const testAPI = createBlockchainAPI(tempDID)

            await testAPI.register(endPoints_Empty);
            await testAPI.revoke();

            await assert.rejects(
                testAPI.register(endPoints_A),
                {message: 'Failed to register endpoints'}
            )
        })
    })

    describe('Lookup', function() {
        this.timeout(100 * 1000)
        it('Get endpoints successfully', async () => {
            const lookupResult = await blockchainApi.lookup(did.address);
            assert.deepEqual(
                lookupResult, 
                {didController:did.address, endpoints:endPoints_B}, 
                'Get updated endpoints');
        })

        it('Should reject for unregistered DID',async () => {
            const testDID = Wallet.createRandom();
            const testAPI = createBlockchainAPI(testDID);
            await assert.rejects(
                testAPI.lookup(testDID.address),
                {message: 'DID not found'}
            )
        })

        it('Should reject for revoked DID', async () => {
            const testDID = Wallet.createRandom();
            const testAPI = createBlockchainAPI(testDID);

            await testAPI.register(endPoints_A);
            await testAPI.revoke();

            await assert.rejects(
                testAPI.lookup(testDID.address),
                {message: 'DID not found'}
            )
        })
    })

    describe('Set controller', function() {
        this.timeout(100 * 1000)
        const controller = Wallet.createRandom();
        it('Should reject for unregistered DID', async () => {
            const testAPI = createBlockchainAPI(Wallet.createRandom());
            await assert.rejects(
                testAPI.setController(controller.privateKey),
                {message: 'Failed to set controller'}
            )
        })

        it('Change controller successfully', async () => {
            const orgDID = Wallet.createRandom();
            const testAPI = createBlockchainAPI(orgDID);

            await testAPI.register(endPoints_Empty);
            const orgController = await testAPI.getController();
            assert.equal(orgController, orgDID.address, 'Controller itself');

            await testAPI.setController(controller.privateKey);
            const newController = await testAPI.getController();
            assert.equal(newController, controller.address, 'Updated controller');

            // Restore controller
            await testAPI.setController(orgDID.privateKey);
        })
    })

    describe('Revoke', function() {
        this.timeout(100 * 1000)
        const testAPI = createBlockchainAPI(Wallet.createRandom());
        it('Should reject for unregistered DID', async () => {
            await assert.rejects(
                testAPI.revoke(),
                {message: 'Failed to revoke'}
            );
        })

        it('Revoked successfully', async () => {
            await testAPI.register(endPoints_A);

            await testAPI.revoke();
        })

        it('Should reject for revoked DID', async () => {
            await assert.rejects(
                testAPI.revoke(),
                {message: 'Failed to revoke'}
            );
        })
    })
})