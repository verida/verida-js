/* eslint-disable prettier/prettier */
import Axios from 'axios';

import { Contract } from '@ethersproject/contracts'
import { Signer } from '@ethersproject/abstract-signer'
import { JsonRpcProvider } from '@ethersproject/providers';

import { isVeridaContract } from './utils'

import { CallType, VeridaWeb3Config, VeridaSelfTransactionConfig, VeridaMetaTransactionConfig, getContractForNetwork } from './config'
import { VeridaGaslessPostConfig, VeridaGaslessRequestConfig } from './config'
// import { gaslessDefaultServerConfig, gaslessDefaultPostConfig } from './config'

import { BigNumber } from '@ethersproject/bignumber'
import { ethers } from 'ethers';

require('dotenv').config();

/** URL for verida meta-transaction-server */
const base_url = process.env.VERIDA_SERVER_URL
  ? process.env.VERIDA_SERVER_URL
  : 'http://localhost';

/** Port for verida meta-transaction-server */
const PORT = process.env.VERIDA_SERVER_PORT
  ? process.env.VERIDA_SERVER_PORT
  : 5021;
const SERVER_URL_HOME = PORT ? `${base_url}:${PORT}` : base_url;

// type NetworkType = 'mainnet' | 'testnet';


/** Create axios instance to make http requests to meta-transaction-server */
const getAxios = async (params?: any) => {
    const config: any = {};
    if (params.headers) {
      config.headers = params.headers;
    }
    return Axios.create(config);
  };

/**
 * Check validity of creating meta-transaction-server instance in gasless mode
 * @param key - Key value provided by Verida. Check validation on creating gasless instance
 * @returns {boolean} - Validity of creating instance
 */
function isValidVeridaKey(key?: string) {
    // if (!key || !key.includes('approved')) {
    //     return false;
    // }
    return true;
}

interface ParameterType {
    [key: string] : any
}

export type address = string
export type uint256 = BigNumber
export interface ERC1056Event {
    identity: address
    previousChange: uint256
    validTo?: uint256
    _eventName: string
    blockNumber: number
  }
export type BlockTag = string | number;

/**
 * Class representing any Verida Smart Contrat
 */
export class VeridaContract {
    /** Smart contract interaction mode */
    protected type: CallType;

    // /** web3 instance. Only used in web3 mode */
    // protected web3?: Web3;

    // /** Account to send transactions in Web3 mode */
    // protected account?: string;

    /** Contract instance used in web3 mode */
    protected contract?: Contract

    protected signer?: Signer

    // Gasless mode variables
    /** Axios instance used in gasless mode */
    protected server: any = null
    /** endpoint url : Need to be defined in sub class constructor */
    protected endPoint? : string

    /** Need such fields to add sub methods in constructor */
    [key: string]: any

    protected gaslessServerConfig? : VeridaGaslessRequestConfig
    protected gaslessPostConfig? : VeridaGaslessPostConfig

    /**
     * Create Verida smart contract instance. Add member functions of contract as parameters.
     * @param type - interaction mode
     * @param config - configuration for creating VeridaContract instance
     */
    constructor(type: CallType, config: VeridaWeb3Config) {
        this.type = type;
        if (type === 'web3') {
            if (!config) {
                throw new Error('Input configuration parameters');
            }

            console.log('Creating Web3 SDK in web3 Mode', config)

            const web3Config = <VeridaSelfTransactionConfig>config;
            if (web3Config.provider || web3Config.signer?.provider || web3Config.rpcUrl) {
                this.contract = getContractForNetwork({
                    provider: web3Config.provider,
                    registry: config.address,
                    rpcUrl: web3Config.rpcUrl,
                    web3: web3Config.web3
                })
            } else {
                throw new Error('either provider or rpcUrl is required to initialize')
            }
            this.signer = web3Config.signer


            // this.web3 = new Web3((<VeridaSelfTransactionConfig>config).provider)
            // this.contract = new this.web3.eth.Contract(
            //     config.abi.abi,
            //     config.address,
            //     (<VeridaSelfTransactionConfig>config).options
            // )

            // this.account = (<VeridaSelfTransactionConfig>config).account

            const methods = config.abi.abi
            methods.forEach((item: any) => {
                if (item.type === 'function') {
                    this[item.name] = async(...params : any[]) => {
                        return await this.callMethod(item.name, item.stateMutability, params);
                    }
                }
            })
        } else {
            if (!isValidVeridaKey((<VeridaMetaTransactionConfig>config).veridaKey)) {
                throw new Error('Input valid Verida Key for gasless transaction')
            }

            if (!isVeridaContract(config.address)) {
                throw new Error('Not a Verida contract address')
            }

            if (!(<VeridaMetaTransactionConfig>config).serverConfig) {
                throw new Error('Need request config')
            }

            this.gaslessServerConfig = (<VeridaMetaTransactionConfig>config).serverConfig

            if (!(<VeridaMetaTransactionConfig>config).postConfig) {
                throw new Error('Need POST config')
            }
            this.gaslessPostConfig = (<VeridaMetaTransactionConfig>config).postConfig

            // this.gaslessServerConfig = (<VeridaMetaTransactionConfig>config).serverConfig ?? gaslessDefaultServerConfig
            // this.gaslessPostConfig = (<VeridaMetaTransactionConfig>config).postConfig ?? gaslessDefaultPostConfig

            this.endPoint = SERVER_URL_HOME

            this.endPoint = `${SERVER_URL_HOME}/${config.abi.contractName}`

            const methods = config.abi.abi
            methods.forEach((item: any) => {
                if (item.type === 'function') {
                    // let params = ''
                    let paramIndex = 1

                    const parameterNameList = new Array<string>()

                    item.inputs.forEach((param: any) => {
                        if (param.name === '') {
                            parameterNameList.push('param_' + paramIndex)
                            // parameterNameList.push('')

                            // params += 'param_' + paramIndex + ','
                            paramIndex++
                        }
                        else {
                            // params += param.name + ','

                            parameterNameList.push(param.name)
                        }
                    });

                    // Remove last '.' in the string
                    // if (params.length > 0) {
                    //     params = params.slice(0, -1)
                    // }

                    // Add Member functions
                    // eval(`this.${item.name} = async (${params}) => {
                    //     return await this.callMethod(
                    //         '${item.name}',
                    //         '${item.stateMutability}',
                    //         {${params}})
                    // }`)

                    this[item.name] = async(...params : any[]) => {
                        // console.log("Parameters : ", ...params)
                        if (params.length !== parameterNameList.length) {
                            throw new Error('Parameter count not matched')
                        }

                        const paramObj : ParameterType = {}
                        for (let i = 0; i < parameterNameList.length; i++) {
                            paramObj[parameterNameList[i]] = params[i];
                        }
                        return await this.callMethod(item.name, item.stateMutability, this.type === 'web3' ? params : paramObj);
                    }
                }
            })
        }
    }

    /**
     * Connect signer to contract to sign transactions. Called in web3 mode only
     *
     * @param controller : Wallet public address
     */
    protected async attachContract(controller?: address | Promise<address>) {
        if (this.type !== 'web3') {
            throw new Error('Only call in web3 mode')
        }
        let signer = this.signer
        if (signer === undefined && controller) {
            const currentOwner = await controller
            signer = (<JsonRpcProvider>this.contract!.provider).getSigner(currentOwner) || this.contract!.signer
        }

        if (!signer) {
            throw new Error('Can not get signer with current configuration')
        }
        return this.contract!.connect(signer)
    }

    /**
     * Perform smart contract interaction. Called by member function that were created in constructor.
     * @param methodName - Calling method name of smart contract. From ABI.
     * @param methodType - Method type. Shows whether method in smart contract is Call function or not.
     * @param params - Parameters used to make interaction with smart contract : Array
     * @returns - Response from smart contract interaction
     */
    protected callMethod = async (methodName: string, methodType: string, params: any ) => {
        if (this.type === 'web3') {
            // const callType = this.isViewFunction(methodName) ? 'call' : 'send'

            // const callType = methodType === 'view' ? 'call' : 'send'
            // const response = eval(`await this.contract!.methods.${methodName}(...(Object.values(params))).${callType}()`)

            let ret;

            console.log('Calling function : ', methodName, params)

            const contract = await this.attachContract()

            // console.log('Contract = ', contract)

            try {
                if (methodType === 'view') {
                    ret = await contract.functions[methodName](...params)
                } else {
                    // From RM
                    let gasLimit = await contract.estimateGas[methodName](...params);
                    const gasPrice = await this.signer!.getGasPrice();

                    // const multiple = BigNumber.from(2)
                    gasLimit = gasLimit.mul(BigNumber.from(2))

                    const unsignedTx = await contract.populateTransaction[methodName](...params, {
                        gasLimit,
                        gasPrice
                    })

                    const transaction = await this.signer!.sendTransaction(unsignedTx)
                    console.log('Transaction = ', transaction)

                    const transactionRecipt = await transaction.wait()
                    console.log('Transaction Receipt = ', transactionRecipt)

                    ret = transactionRecipt


                    /*
                    // Working part
                    const transaction = await contract.functions[methodName](...params, {
                        // gasPrice: 5000000,
                        maxFeePerGas: ethers.utils.parseUnits('100','gwei'),
                        maxPriorityFeePerGas: ethers.utils.parseUnits('100','gwei')
                    })
                    console.log('web3 SDK : ', transaction)

                    // Wait for confirmed
                    ret = await transaction.wait() // Return transactionReceipt

                    console.log('transactionReceipt : ', ret)
                    */
                }
            } catch(e: any) {
                console.log('Error in transaction', e)
                return {
                    success: false,
                    data: {
                        message: e.toString()
                    }
                }
            }

            return {
                success: true,
                data: ret
            }
        } else {
            if (this.server === null) {
                this.server = await getAxios(this.gaslessServerConfig)
            }
            const url = `${this.endPoint}/${methodName}`;

            const response = await this.server.post(
                url,
                params,
                this.gaslessPostConfig)
            return response.data
        }
    }

    /**
     * @notice Get the time of last change in DID-registry-contract
     * @param identity DID of a user
     */
    protected async didPreviousChange(identity: string) {
        const response = await this.callMethod('changed', 'view', {
            '': identity
        })

        if (response.success === true) {
            return BigNumber.from(response.data)
        }
        return null
    }

    // protected addGetEventsToDIDRegistry(

    // ) {
    //     // To-do [Alex] implement this method
    //     this['getEvents'] = async(identity: string) => {
    //         let previousChange : BigNumber | null = this.didPreviousChange(identity)
    //         while (previousChange) {
    //             const blockNumber = previousChange
    //             const fromBlock = previousChange.toHexString() !== '0x00' ? previousChange.sub(1).toHexString() : previousChange.toHexString()
    //             const logs = await 
    //         }

    //     }
    // }
}
