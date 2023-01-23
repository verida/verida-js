/* eslint-disable prettier/prettier */
import Axios from 'axios';
import { JsonRpcProvider } from '@ethersproject/providers';
import { isVeridaContract } from './utils'
import { getContractForNetwork, isVeridaWeb3GasConfiguration } from './config'
import { Wallet, BigNumber, Contract, Signer } from 'ethers';
import { VdaTransactionResult, VeridaWeb3Config, Web3CallType, Web3GasConfiguration, Web3GaslessPostConfig, Web3GaslessRequestConfig, Web3MetaTransactionConfig, Web3SelfTransactionConfig } from '@verida/types';

/** Create axios instance to make http requests to meta-transaction-server */
const getAxios = async (params?: any) => {
    const config: any = {};
    if (params.headers) {
      config.headers = params.headers;
    }
    return Axios.create(config);
  };

interface ParameterType {
    [key: string] : any
}

export type address = string
export type uint256 = BigNumber
export type BlockTag = string | number;

/**
 * Class representing any Verida Smart Contrat
 */
export class VeridaContract {
    /** Smart contract interaction mode */
    protected type: Web3CallType;

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

    /** Configuration for web3 mode */
    protected web3Config? : Web3SelfTransactionConfig

    /** Configuration for gasless mode */
    protected gaslessServerConfig? : Web3GaslessRequestConfig
    protected gaslessPostConfig? : Web3GaslessPostConfig

    /**
     * Create Verida smart contract instance. Add member functions of contract as parameters.
     * @param type - interaction mode
     * @param config - configuration for creating VeridaContract instance
     */
    constructor(type: Web3CallType, config: VeridaWeb3Config) {
        this.type = type;
        if (type === 'web3') {
            if (!config) {
                throw new Error('Input configuration parameters');
            }

            const web3Config = <Web3SelfTransactionConfig>config;
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

                        let gasConfig : Web3GasConfiguration | undefined = undefined

                        const paramLen = params.length
                        if (params !== undefined
                            && paramLen > 0
                            && typeof params[paramLen-1] === 'object'
                            && params[paramLen - 1].constructor.name === 'Object'
                            && isVeridaWeb3GasConfiguration(params[paramLen - 1]))
                        { // Use gas configuration in the params
                            gasConfig = <Web3GasConfiguration>params[paramLen-1]
                            params = params.slice(0, paramLen - 1)
                        } else if (this.web3Config?.methodDefaults !== undefined && (item.name in this.web3Config?.methodDefaults)) {
                            // Use gas configuration in the methodDefaults
                            gasConfig = Object.assign({}, this.web3Config.methodDefaults[item.name])
                        } else if (this.web3Config !== undefined) {
                            // Use gas configuration in the global configuration
                            gasConfig = {}
                            if ('maxFeePerGas' in this.web3Config) {
                                gasConfig['maxFeePerGas'] = this.web3Config['maxFeePerGas']
                            }

                            if ('maxPriorityFeePerGas' in this.web3Config) {
                                gasConfig['maxPriorityFeePerGas'] = this.web3Config['maxPriorityFeePerGas']
                            }

                            if ('gasLimit' in this.web3Config) {
                                gasConfig['gasLimit'] = this.web3Config['gasLimit']
                            }
                        }

                        return this.callMethod(item.name, item.stateMutability, params, gasConfig)
                    }
                }
            })

            this.web3Config = web3Config
        } else {
            if (!isVeridaContract(config.address)) {
                throw new Error(`Not a Verida contract address (${config.address})`)
            }

            if (!(<Web3MetaTransactionConfig>config).serverConfig) {
                throw new Error('Need request config')
            }

            this.gaslessServerConfig = (<Web3MetaTransactionConfig>config).serverConfig

            if (!(<Web3MetaTransactionConfig>config).postConfig) {
                throw new Error('Need POST config')
            }
            this.gaslessPostConfig = (<Web3MetaTransactionConfig>config).postConfig

            // @ts-ignore Unsure why the OR typescript isn't being picked up here
            this.endPoint = `${config.endpointUrl}/${config.abi.contractName}`

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
     * @param gasConfig - Gas configuration. Only available for non-view functions in Web3 mode
     * @returns - Response from smart contract interaction
     */
    protected callMethod = async (methodName: string, methodType: string, params: any, gasConfig? : Web3GasConfiguration) : Promise<VdaTransactionResult> =>  {
        if (this.type === 'web3') {
            let ret;

            const contract = await this.attachContract()

            // console.log('Contract = ', contract)

            try {
                if (methodType === 'view') {
                    ret = await contract.callStatic[methodName](...params)
                } else {
                    // console.log('Gas Config : ', gasConfig)

                    let transaction: any
                    if (gasConfig === undefined) { //Gas configuration is in the params
                        transaction = await contract.functions[methodName](...params)
                    } else { // Need to use manual gas configuration
                        transaction = await contract.functions[methodName](...params, gasConfig)
                    }

                    const transactionRecipt = await transaction.wait(1)
                    // console.log('Transaction Receipt = ', transactionRecipt)

                    ret = transactionRecipt
                }
            } catch(e: any) {
                // console.log('Error in transaction', e)
                return Promise.resolve({
                    success: false,
                    error: e.toString()
                })
            }

            if (BigNumber.isBigNumber(ret)) ret = ret.toNumber()

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

}
