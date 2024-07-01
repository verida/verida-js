const assert = require('assert')
import { DID_LIST } from "@verida/vda-common-test";
import BlockchainApi from "../src/blockchain/blockchainApi"
import { BlockchainAnchor, VdaDidConfigurationOptions } from '@verida/types';
import { Wallet } from "ethers";
require('dotenv').config();

// const did = Wallet.createRandom();
const didWallet = new Wallet(DID_LIST[0].privateKey);
const did = `did:vda:${BlockchainAnchor.POLPOS}:${didWallet.address}`;

const endPoints_A = ['https://A_1', 'https://A_2', 'https://A_3'];
const endPoints_B = ['https://B_1', 'https://B_2'];
const endPoints_Empty: string[] = [];


const privateKey = process.env.PRIVATE_KEY;
if (!privateKey) {
    throw new Error('No PRIVATE_KEY in the env file');
}

const configuration = {
    callType: 'web3',
    web3Options: {
        privateKey,
        eip1559Mode: 'fast',
        eip1559gasStationUrl: 'https://gasstation.polygon.technology/v2'
    }
  }

const createBlockchainAPI = (did: any) => {
    return new BlockchainApi(<VdaDidConfigurationOptions>{
        identifier: `did:vda:${BlockchainAnchor.POLPOS}:${did.address}`,
        signKey: did.privateKey,
        blockchain: BlockchainAnchor.POLPOS,
        ...configuration
    })
}

describe('vda-did blockchain api', () => {
    let blockchainApi : BlockchainApi
    before(() => {
        blockchainApi = createBlockchainAPI(didWallet);
    })

    describe('register', function() {
        this.timeout(100 * 1000)

        it('Register successfully', async () => {
            await blockchainApi.register(endPoints_A);

            const lookupResult = await blockchainApi.lookup(did);
            assert.deepEqual(
                lookupResult, 
                {didController: didWallet.address, endpoints: endPoints_A},
                'Get same endpoints');
        })

        it('Should update for registered DID', async () => {
            await blockchainApi.register(endPoints_B);

            const lookupResult = await blockchainApi.lookup(did);
            assert.deepEqual(
                lookupResult, 
                {didController: didWallet.address, endpoints: endPoints_B}, 
                'Get updated endpoints');
        })

        it('Should reject for revoked did', async () => {
            const tempDID = Wallet.createRandom();
            const testAPI = createBlockchainAPI(tempDID)

            await testAPI.register(endPoints_Empty);
            await testAPI.revoke();

            await assert.rejects(
                testAPI.register(endPoints_A),
                (err) => {
                    assert.ok(err.message.startsWith('Failed to register endpoints'));
                    return true;
                }
            )
        })
    })
})