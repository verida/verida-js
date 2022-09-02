/* eslint-disable prettier/prettier */
import Axios from 'axios';

import { ethers } from 'ethers';
import { JsonRpcProvider } from '@ethersproject/providers';

import { isVeridaContract } from './utils'

import { CallType, VeridaWeb3Config, VeridaSelfTransactionConfig, VeridaMetaTransactionConfig, getContractForNetwork } from './config'
import { VeridaGaslessPostConfig, VeridaGaslessRequestConfig } from './config'
// import { gaslessDefaultServerConfig, gaslessDefaultPostConfig } from './config'

import { Wallet, BigNumber, Contract, Signer } from 'ethers';

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
export type BlockTag = string | number;

export interface VdaTransactionResult {
    success: boolean;
    data?: any
    error?: string
}

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

            const web3Config = <VeridaSelfTransactionConfig>config;
            if (web3Config.provider || web3Config.signer?.provider || web3Config.rpcUrl) {

                // console.log("VeridaContractBase : ", config.abi.abi)

                this.contract = getContractForNetwork({
                    abi: config.abi,
                    address: config.address,
                    provider: web3Config.provider,
                    registry: config.address,
                    rpcUrl: web3Config.rpcUrl,
                    web3: web3Config.web3
                })
            } else {
                throw new Error('either provider or rpcUrl is required to initialize')
            }
            this.signer = web3Config.signer
            if (this.signer === undefined) {
                if ( web3Config.privateKey )
                    this.signer = new Wallet(web3Config.privateKey, this.contract.provider)
                else
                    throw new Error('either Signer or privateKey is required to initialize')
            }

            const methods = config.abi.abi
            methods.forEach((item: any) => {
                if (item.type === 'function') {
                    this[item.name] = async(...params : any[]) : Promise<VdaTransactionResult> => {
                        return this.callMethod(item.name, item.stateMutability, params)
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
                            paramIndex++
                        }
                        else {
                            parameterNameList.push(param.name)
                        }
                    });

                    this[item.name] = async(...params : any[]) => {
                        // console.log("Parameters : ", ...params)
                        if (params.length !== parameterNameList.length) {
                            throw new Error('Parameter count not matched')
                        }

                        const paramObj : ParameterType = {}
                        for (let i = 0; i < parameterNameList.length; i++) {
                            paramObj[parameterNameList[i]] = params[i];
                        }
                        return this.callMethod(item.name, item.stateMutability, this.type === 'web3' ? params : paramObj)
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
    protected callMethod = async (methodName: string, methodType: string, params: any ) : Promise<VdaTransactionResult> =>  {
        if (this.type === 'web3') {
            let ret;

            const contract = await this.attachContract()

            // console.log('Contract = ', contract)

            try {
                if (methodType === 'view') {
                    ret = await contract.callStatic[methodName](...params)
                } else {
                    let { gasPrice } = await contract.provider.getFeeData()
                    gasPrice = gasPrice!.mul(BigNumber.from(11)).div(BigNumber.from(10))

                    let gasLimit = await contract.estimateGas[methodName](...params);
                    gasLimit = gasLimit.mul(BigNumber.from(11)).div(BigNumber.from(10)) // Multiply 1.1

                    const transaction = await contract.functions[methodName](...params, {
                        gasLimit,
                        gasPrice
                    })

                    const transactionRecipt = await transaction.wait()
                    // console.log('Transaction Receipt = ', transactionRecipt)

                    ret = transactionRecipt
                }
            } catch(e: any) {
                console.log('Error in transaction', e)
                return Promise.resolve({
                    success: false,
                    error: e.toString()
                })
            }

            if (BigNumber.isBigNumber(ret)) ret = ret.toNumber()

            return Promise.resolve({
                success: true,
                data: ret
            })
        } else {
            if (this.server === null) {
                this.server = await getAxios(this.gaslessServerConfig)
            }
            const url = `${this.endPoint}/${methodName}`;

            const response = await this.server.post(
                url,
                params,
                this.gaslessPostConfig)
            return Promise.resolve(response.data)
        }
    }

}
