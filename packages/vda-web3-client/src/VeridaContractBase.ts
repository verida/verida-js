/* eslint-disable prettier/prettier */
import Axios from 'axios';
import { JsonRpcProvider } from '@ethersproject/providers';
import { isVeridaContract, getMaticFee } from './utils'
import { getContractInstance, isVeridaWeb3GasConfiguration } from './config'
import { Wallet, BigNumber, Contract, Signer, utils } from 'ethers';
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

type TGasConfigKeys = keyof Web3GasConfiguration;

/**
 * Class representing any Verida Smart Contrat
 */
export class VeridaContract {
    /** Smart contract interaction mode */
    protected type: Web3CallType;

    /** Contract instance used in web3 mode */
    protected contract?: Contract

    /** Signer for transactions */
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

                // console.log("VeridaContractBase : ", config);
                const provider = web3Config.provider ?? web3Config.signer?.provider;

                this.contract = getContractInstance({
                    provider,

                    blockchainAnchor: web3Config.blockchainAnchor,
                    rpcUrl: web3Config.rpcUrl,
                    chainId: web3Config.chainId,

                    abi: config.abi,
                    address: config.address,
                })
            } else {
                throw new Error('either provider or rpcUrl is required to initialize')
            }
            this.signer = web3Config.signer
            
            if (!this.signer && web3Config.privateKey) {
                this.signer = new Wallet(web3Config.privateKey, this.contract.provider);
            }

            // if(this.signer) {
            //     this.contract = this.contract!.connect(this.signer);
            // }

            const methods = config.abi.abi
            methods.forEach((item: any) => {
                if (item.type === 'function') {
                    this[item.name] = async(...params : any[]) : Promise<VdaTransactionResult> => {

                        let gasConfig : Record<string, any> | undefined = undefined

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
                        } else if (this.web3Config !== undefined && isVeridaWeb3GasConfiguration(this.web3Config)) {
                            // Use gas configuration in the global configuration
                            const keys:TGasConfigKeys[] = ['eip1559Mode', 'eip1559gasStationUrl', 'maxFeePerGas', 'maxPriorityFeePerGas', 'gasLimit', 'gasPrice'];
                            gasConfig = {}
                            for (let i = 0; i < keys.length; i++) {
                                if (keys[i] in this.web3Config) {
                                    gasConfig[keys[i]] = this.web3Config[keys[i]];
                                }
                            }
                        }

                        // console.log('vda-web3 gasconfig : ', gasConfig);
                        if (gasConfig === undefined || Object.keys(gasConfig).length === 0) {
                            // Call transaction without gas configuration
                            return this.callMethod(item.name, item.stateMutability, params)
                        }

                        const eip1559Keys:TGasConfigKeys[] = ['eip1559Mode', 'eip1559gasStationUrl'];
                        const keys:TGasConfigKeys[] = ['maxFeePerGas', 'maxPriorityFeePerGas', 'gasLimit', 'gasPrice'];
                        let isGasConfigured = false;
                        for (let i = 0; i < keys.length; i++) {
                            if (keys[i] in gasConfig) {
                                isGasConfigured = true;
                                break;
                            }
                        }
                        if (isGasConfigured) {
                            // Remove unnecessary EIP1559 keys if exist in the gas config
                            for (let i = 0; i < eip1559Keys.length; i++) {
                                if (eip1559Keys[i] in gasConfig) {
                                    delete gasConfig[eip1559Keys[i]];
                                }
                            }
                        } else { // Need to pull the gas configuration from the station
                            // console.log("Getting gas config....");
                            if ('eip1559Mode' in gasConfig && 'eip1559gasStationUrl' in gasConfig) {
                                gasConfig = await getMaticFee(gasConfig['eip1559gasStationUrl'], gasConfig['eip1559Mode']);
                                // console.log("gas config : ", gasConfig);
                            } else {
                                throw new Error('To use the station gas configuration, need to specify eip1559Mode & eip1559gasStationUrl');
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
                if (methodType === 'view' || methodType === 'pure') {
                    ret = await contract.callStatic[methodName](...params)
                } else {
                
                    if (!this.signer) {
                        throw new Error(`No 'signer' or 'privateKey' in the configuration`);
                    }

                    let transaction: any

                    // console.log("params : ", params);

                    if (gasConfig === undefined || Object.keys(gasConfig).length === 0) { //No gas configuration
                        transaction = await contract.functions[methodName](...params);
                    } else {
                        transaction = await contract.functions[methodName](...params, gasConfig);
                    }

                    // console.log("transaction : ", transaction);
                    const transactionReceipt = await transaction.wait()
                    // console.log("transactionReceipt : ", transactionReceipt);

                    ret = transactionReceipt
                }
            } catch(e: any) {
                // console.log('vda-web3 : Error in transaction', e)
                let reason = e.reason ? e.reason : 'Unknown'
                reason = e.error && e.error.reason ? e.error.reason : reason
                reason = reason.replace('execution reverted: ','')

                if (reason === 'Unknown' && e.errorName) {
                    reason = e.errorName;
                }

                return Promise.resolve({
                    success: false,
                    error: e.toString(),
                    errorObj: e,
                    reason
                })
            }

            // Overflow error in `vda-node-manager` to get node issue fee.
            // if (BigNumber.isBigNumber(ret)) ret = ret.toNumber()

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
