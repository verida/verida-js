const assert = require('assert')
import BlockchainApi from "../src/blockchain/blockchainApi"
import { BigNumber, Wallet } from "ethers";
import { VdaDidConfigurationOptions } from '@verida/types';
require('dotenv').config();

const did = Wallet.createRandom();

const endPoints_A = ['https://A_1', 'https://A_2', 'https://A_3'];

const privateKey = process.env.PRIVATE_KEY;
if (!privateKey) {
    throw new Error('No PRIVATE_KEY in the env file');
}

const createBlockchainAPI = (did: any, configuration:any) => {
    return new BlockchainApi(<VdaDidConfigurationOptions>{
        identifier: did.address,
        signKey: did.privateKey,
        chainNameOrId: "testnet",
        ...configuration
    })
}

const checkResult =async (configuration: any,  isSuccess = true, errMsg : string | undefined = undefined) => {
    const blockchainApi = createBlockchainAPI(did, configuration);

    if (isSuccess) {
        await blockchainApi.register(endPoints_A);
        const lookupResult = await blockchainApi.lookup(did.address);
        assert.deepEqual(
            lookupResult, 
            {didController: did.address, endpoints: endPoints_A},
            'Get same endpoints');
    } else {
        let f = () => {};
        try {
            await blockchainApi.register(endPoints_A);
        } catch (err: any) {
            f = () => {throw err};
        } finally {
            if (errMsg !== undefined) {
                assert.throws(f, Error, errMsg);
            } else {
                assert.throws(f, Error);
            }
            
        }
    }
}

const checkGlobalGasConfig = async (gasOption: Record<string, any>, isSuccess = true, errMsg : string | undefined = undefined) => {
    const configuration = {
        callType: 'web3',
        web3Options: {
            privateKey,
            ...gasOption
        }
    }
    await checkResult(configuration, isSuccess, errMsg);
}

const checkMethodDefaultGasConfig = async (gasOption: Record<string, any>, isSuccess = true, errMsg : string | undefined = undefined) => {
    const configuration = {
        callType: 'web3',
        web3Options: {
            privateKey,
            methodDefaults: {
                "register": gasOption
            }
        }
    }
    await checkResult(configuration, isSuccess, errMsg);
}

const checkRuntimeGasConfig = async (blockchainApi:BlockchainApi, gasOption: Record<string, any>, isSuccess = true, errMsg : string | undefined = undefined) => {
    if (isSuccess) {
        await blockchainApi.register(endPoints_A, gasOption);
        const lookupResult = await blockchainApi.lookup(did.address);
        assert.deepEqual(
            lookupResult, 
            {didController: did.address, endpoints: endPoints_A},
            'Get same endpoints');
    } else {
        let f = () => {};
        try {
            await blockchainApi.register(endPoints_A, gasOption);
        } catch (err: any) {
            f = () => {throw err};
        } finally {
            if (errMsg !== undefined) {
                assert.throws(f, Error, errMsg);
            } else {
                assert.throws(f, Error);
            }
            
        }
    }
}

describe('vda-did blockchain api test for different gas configurations', function(){
    let blockchainApi : BlockchainApi
    this.timeout(100 * 1000)

    describe('Global gas configuration', function() {
        describe('Gas configuration from gas station url', function(){
            it("Failed for insufficient gas parameters",async () => {
                let gasOption: Record<string, any> = {
                    eip1559Mode: 'fast',
                }
                await checkGlobalGasConfig(gasOption, false, 'To use the station gas configuration, need to specify eip1559Mode & eip1559gasStationUrl');


                gasOption = {
                    eip1559gasStationUrl: 'https://gasstation-testnet.polygon.technology/v2'
                }
                await checkGlobalGasConfig(gasOption, false, 'To use the station gas configuration, need to specify eip1559Mode & eip1559gasStationUrl');
            })

            it("Success", async () => {
                const mode = ['safeLow', 'standard', 'fast'];
                for (let i = 0; i < mode.length; i++) {
                    const gasOption = {
                        eip1559Mode: mode[i],
                        eip1559gasStationUrl: 'https://gasstation-testnet.polygon.technology/v2'
                    }
                    await checkGlobalGasConfig(gasOption, true);
                }   
            })
        })

        describe('Manual gas configuration test', function() {
            it("Success with `maxFeePriority` option only", async () => {
                const gasOption = {
                    maxPriorityFeePerGas: BigNumber.from("1000000000"), //1Gwei
                }
                await checkGlobalGasConfig(gasOption, true);
            })

            it("Success with `maxFee` option only", async () => {
                const gasOption = {
                    maxFeePerGas: BigNumber.from("5000000000") //5Gwei
                }
                await checkGlobalGasConfig(gasOption, true);
            })

            it("Success with both parameters",async () => {
                const gasOption = {
                    maxPriorityFeePerGas: BigNumber.from("1000000000"), //1Gwei
                    maxFeePerGas: BigNumber.from("5000000000") //5Gwei
                }
                await checkGlobalGasConfig(gasOption, true);
            })
        })
    })

    describe('Method default gas configuration', function() {
        describe('Gas configuration from gas station url', function() {
            it('Success', async() => {
                const gasOption = {
                    eip1559Mode: 'fast',
                    eip1559gasStationUrl: 'https://gasstation-testnet.polygon.technology/v2'
                }
                await checkMethodDefaultGasConfig(gasOption, true);
            })
        })

        describe('Manual gas configuration', function() {
            it('Failed for invalid gas configuration', async () => {
                const gasOption = {
                    maxPriorityFeePerGas: BigNumber.from("10000000000"), //10Gwei
                    maxFeePerGas: BigNumber.from("5000000000") //5Gwei
                }
                await checkMethodDefaultGasConfig(gasOption, false);
            })

            it('Success', async () => {
                const gasOption = {
                    maxPriorityFeePerGas: BigNumber.from("1000000000"), //1Gwei
                    maxFeePerGas: BigNumber.from("5000000000") //5Gwei
                }
                await checkMethodDefaultGasConfig(gasOption, true);
            })
        })        
    })

    describe('Gas configuration at runtime', function() {
        const blockchainApi = createBlockchainAPI(did, {
            callType: 'web3',
            web3Options: {
                privateKey,
            }
        })
        describe('Gas configuration from gas station url', function() {
            it('Success', async () => {
                const gasOption = {
                    eip1559Mode: 'fast',
                    eip1559gasStationUrl: 'https://gasstation-testnet.polygon.technology/v2'
                }
                await checkRuntimeGasConfig(blockchainApi, gasOption, true);
            })
        })

        describe('Manual gas configuration', function() {
            it('Faild for invalid gas configuration', async () => {
                const gasOption = {
                    maxPriorityFeePerGas: BigNumber.from("10000000000"), //10Gwei
                    maxFeePerGas: BigNumber.from("5000000000") //5Gwei
                }
                await checkRuntimeGasConfig(blockchainApi, gasOption, false);
            })
            it('Success with valid gas configuration',async () => {
                const gasOption = {
                    maxPriorityFeePerGas: BigNumber.from("1000000000"), //1Gwei
                    maxFeePerGas: BigNumber.from("5000000000") //5Gwei
                }
                await checkRuntimeGasConfig(blockchainApi, gasOption, true);
            })
            it('Success with empty gas configuration',async () => {
                const gasOption = {}
                await checkRuntimeGasConfig(blockchainApi, gasOption, true);
            })
        })

    })

    // describe('register', function() {
    //     this.timeout(100 * 1000)

    //     it.only('Register successfully', async () => {
    //         await blockchainApi.register(endPoints_A);

    //         const lookupResult = await blockchainApi.lookup(did.address);
    //         assert.deepEqual(
    //             lookupResult, 
    //             {didController: did.address, endpoints: endPoints_A},
    //             'Get same endpoints');
    //     })

    //     it('Should update for registered DID', async () => {
    //         await blockchainApi.register(endPoints_B);

    //         const lookupResult = await blockchainApi.lookup(did.address);
    //         assert.deepEqual(
    //             lookupResult, 
    //             {didController: did.address, endpoints: endPoints_B}, 
    //             'Get updated endpoints');
    //     })

    //     it('Should reject for revoked did', async () => {
    //         const tempDID = Wallet.createRandom();
    //         const testAPI = createBlockchainAPI(tempDID)

    //         await testAPI.register(endPoints_Empty);
    //         await testAPI.revoke();

    //         await assert.rejects(
    //             testAPI.register(endPoints_A),
    //             {message: 'Failed to register endpoints'}
    //         )
    //     })
    // })
   
})