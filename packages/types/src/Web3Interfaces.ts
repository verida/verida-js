import { Signer } from '@ethersproject/abstract-signer'
import { BigNumber } from '@ethersproject/bignumber'
import { Provider } from '@ethersproject/providers'
import { BlockchainAnchor } from './NetworkInterfaces'


/** Web3 SDK running mode */
export type Web3CallType = 'web3' | 'gasless'

/** Contract Info. Used for 'web3' mode */
export interface Web3ContractInfo {
    abi: any
    address: string
    logPerformance?: boolean
}

/** EIP1559 Gas Configuration speed */
export type EIP1559GasMode = 'safeLow' | 'standard' | 'fast';
/** Gas configuration 
 * 
 * eip1559Mode - optional - Once this parameter is set, all other parameters are not used. Gas information is pulled from network.
 * 
 * maxFeePerGas - optional - Used for EIP1559 chains
 * maxPriorityFeePerGas - optional - Used for EIP1559 chains
 * gasLimit - optional - Used for non EIP1559 chains
 * gasPrice - optional - Used for non EIP1559 chains
*/
export interface Web3GasConfiguration {
    eip1559Mode?: EIP1559GasMode;
    eip1559gasStationUrl?: string;

    maxFeePerGas?: BigNumber;
    maxPriorityFeePerGas?: BigNumber;
    gasLimit?: BigNumber;
    gasPrice?: BigNumber;
}

/**
 * Configuration type for Web3 mode
 *
 * signer - optional - a Signer that sign the blockchain transactions. If a 'signer' is not provided, then 'contract' with an attached signer need to be used to make transactions
 * provider - optional - a web3 provider. At least one of `signer`,`provider`, or `rpcUrl` is required
 * rpcUrl - optinal - a JSON-RPC URL that can be used to connect to an ethereum network. At least one of `signer`, `provider`, or `rpcUrl` is required
 * web3 - optional - Can use provider or web.currentProvider as a provider.
 */
export interface Web3SelfTransactionConfig extends Web3GasConfiguration {
    signer?: Signer
    privateKey?: string
    provider?: Provider
    rpcUrl?: string
    web3?: any

    methodDefaults?: Record<string, Web3GasConfiguration>
}

/** Configuration type for gasless mode */
export interface Web3MetaTransactionConfig {
    serverConfig: Web3GaslessRequestConfig
    postConfig: Web3GaslessPostConfig
    endpointUrl: string
}

export type VeridaWeb3Config = Web3ContractInfo & (Web3SelfTransactionConfig | Web3MetaTransactionConfig)

/** Configuration type for gasless request */
export interface Web3GaslessRequestConfig {
    headers: {
        'context-name': string
        [key: string] : any
    }
    [key: string] : any
}

/** Configuration type for gasless post */
export interface Web3GaslessPostConfig {
    headers: {
        'user-agent': string
        [key: string] : any
    }
    [key: string] : any
}

/**
 * A configuration entry for an ethereum network
 * It should contain at least one of `name` or `chainId` AND one of `provider`, `web3`, or `rpcUrl`
 *
 * @example ```js
 * { name: 'development', registry: '0x9af37603e98e0dc2b855be647c39abe984fc2445', rpcUrl: 'http://127.0.0.1:8545/' }
 * { name: 'goerli', chainId: 5, provider: new InfuraProvider('goerli') }
 * { name: 'rinkeby', provider: new AlchemyProvider('rinkeby') }
 * { name: 'rsk:testnet', chainId: '0x1f', rpcUrl: 'https://public-node.testnet.rsk.co' }
 * ```
 */
 export interface Web3ProviderConfiguration {
    // name?: string
    provider?: Provider
    rpcUrl?: string
    chainId?: string | number
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    web3?: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [index: string]: any
}

export type VeridaWeb3ConfigurationOptions =
| Web3MetaTransactionConfig
| Web3SelfTransactionConfig;

/**
 * Interface for VDA-DID instance creation.
 * 
 * `signKey` or `signer` must be provided
 * 
 * @param identifier: DID
 * @param signKey: private key of DID's controller. Used to generate signature in transactions to chains
 * @param signer: Signing function that accepts a private key and returns a signature in hex format
 * @param chainNameOrId: Target chain name or chain id.
 * @param callType : VDA-DID run mode. Values from vda-did-resolver
 * @param web3Options: Web3 configuration depending on call type. Values from vda-did-resolver
 */
export interface VdaDidConfigurationOptions {
    identifier: string;
    signKey?: string;
    signer?: (data: any) => Promise<string>;
    //chainNameOrId?: string | number;
    blockchain: BlockchainAnchor

    callType: Web3CallType;
    web3Options: VeridaWeb3ConfigurationOptions;
}

export interface VdaDidEndpointResponse {
    status: 'success' | 'fail',
    message?: string
}

export type VdaDidEndpointResponses = Record<string, VdaDidEndpointResponse>

// Part of VeridaSelfTransactionConfig
export interface Web3SelfTransactionConfigPart  {
    signer?: Signer         // Pre-built transaction signer that is configured to pay for gas
    privateKey?: string     // MATIC private key that will pay for gas
}

export interface Web3ResolverConfigurationOptions {
    rpcUrl?: string;
    timeout?: number;
}

export interface VdaTransactionResult {
    success: boolean;
    data?: any
    error?: string
}