require('dotenv').config();
import { dids, getBlockchainAPIConfiguration } from "./utils"
import BlockchainApi from "../src/blockchain/blockchainApi"
import { Wallet } from "ethers";

const assert = require('assert')

const did = dids[0];
const badSigner = dids[1];

const endPoints_A = ['https://A_1', 'https://A_2', 'https://A_3'];
const endPoints_B = ['https://B_1', 'https://B_2'];
const endPoints_Empty: string[] = [];

const configuration = getBlockchainAPIConfiguration();
const createBlockchainAPI = (did: any) => {
    return new BlockchainApi({
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

    describe('register', () => {
        it('Register successfully', async () => {
            await blockchainApi.register(endPoints_A);

            const endpoints = await blockchainApi.lookup();
            assert.deepEqual(endpoints, endPoints_A, 'Get same endpoints');
        })

        it('Should update for registered DID', async () => {
            await blockchainApi.register(endPoints_B);

            const endpoints = await blockchainApi.lookup();
            assert.deepEqual(endpoints, endPoints_B, 'Get updated endpoints');
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

    describe('Lookup', () => {
        it('Get endpoints successfully', async () => {
            const endpoints = await blockchainApi.lookup();
            assert.deepEqual(endpoints, endPoints_B, 'Get updated endpoints');
        })

        it('Should reject for unregistered DID',async () => {
            const testAPI = createBlockchainAPI(Wallet.createRandom());
            await assert.rejects(
                testAPI.lookup(),
                {message: 'Failed to lookup'}
            )
        })

        it('Should reject for revoked DID', async () => {
            const testAPI = createBlockchainAPI(Wallet.createRandom());

            await testAPI.register(endPoints_A);
            await testAPI.revoke();

            await assert.rejects(
                testAPI.lookup(),
                {message: 'Failed to lookup'}
            )
        })
    })

    describe('Set controller', () => {
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

    describe('Revoke', () => {
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