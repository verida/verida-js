require('dotenv').config();
import { VeridaTokenClient } from "../src/index"
import { Wallet } from "ethers";
import { BlockchainAnchor, Network } from "@verida/types";

const assert = require('assert')

const privateKey = process.env.PRIVATE_KEY
if (!privateKey) {
    throw new Error('No PRIVATE_KEY in the env file');
}

const needMint = process.env.NEED_TOKEN_MINT === 'true';

const createBlockchainAPI = async () => {
    return await VeridaTokenClient.CreateAsync({
        blockchainAnchor: BlockchainAnchor.DEVNET,
        privateKey
    })
}

describe('vda-token-client read and write tests', function() {
    this.timeout(200*1000)

    let blockchainApi : VeridaTokenClient;

    before(async () => {
        blockchainApi = await createBlockchainAPI();

        const contractOwner = await blockchainApi.owner();
        const curUser = new Wallet(privateKey);

        if (contractOwner.toLowerCase() === curUser.address.toLowerCase()) {
            await blockchainApi.min
        }
    })



    /*
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
    */
   
})