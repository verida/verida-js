import { Signer } from '@ethersproject/abstract-signer'
import { BigNumber } from '@ethersproject/bignumber'
import { Provider } from '@ethersproject/providers'


/** Web3 SDK running mode */
export type CallType = 'web3' | 'gasless'

/** Contract Info. Used for 'web3' mode */
export interface ContractInfo {
    abi: any
    address: string
    logPerformance?: boolean
}

/** Gas configuration */
export interface VeridaWeb3GasConfiguration {
    maxFeePerGas?: BigNumber
    maxPriorityFeePerGas?: BigNumber
    gasLimit?: BigNumber
}

/**
 * Configuration type for Web3 mode
 *
 * signer - optional - a Signer that sign the blockchain transactions. If a 'signer' is not provided, then 'contract' with an attached signer need to be used to make transactions
 * provider - optional - a web3 provider. At least one of `signer`,`provider`, or `rpcUrl` is required
 * rpcUrl - optinal - a JSON-RPC URL that can be used to connect to an ethereum network. At least one of `signer`, `provider`, or `rpcUrl` is required
 * web3 - optional - Can use provider or web.currentProvider as a provider.
 */
export interface VeridaSelfTransactionConfig extends VeridaWeb3GasConfiguration {
    signer?: Signer
    privateKey?: string
    provider?: Provider
    rpcUrl?: string
    web3?: any

    methodDefaults?: Record<string, VeridaWeb3GasConfiguration>
}

/** Configuration type for gasless mode */
export interface VeridaMetaTransactionConfig {
    serverConfig: VeridaGaslessRequestConfig
    postConfig: VeridaGaslessPostConfig
    endpointUrl: string
}

export type VeridaWeb3Config = ContractInfo & (VeridaSelfTransactionConfig | VeridaMetaTransactionConfig)

/** Configuration type for gasless request */
export interface VeridaGaslessRequestConfig {
    headers: {
        'context-name': string
        [key: string] : any
    }
    [key: string] : any
}

/** Configuration type for gasless post */
export interface VeridaGaslessPostConfig {
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
 export interface ProviderConfiguration {
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
| VeridaMetaTransactionConfig
| VeridaSelfTransactionConfig;

/**
 * Interface for VDA-DID instance creation
 * @param identifier: DID
 * @param signKey: private key of DID's controller. Used to generate signature in transactions to chains
 * @param chainNameOrId: Target chain name or chain id.
 * @param callType : VDA-DID run mode. Values from vda-did-resolver
 * @param web3Options: Web3 configuration depending on call type. Values from vda-did-resolver
 */
export interface VdaDidConfigurationOptions {
identifier: string;
signKey: string;
chainNameOrId?: string | number;

callType: CallType;
web3Options: VeridaWeb3ConfigurationOptions;
}

export interface VdaDidEndpointResponse {
status: 'success' | 'fail',
message?: string
}

export type VdaDidEndpointResponses = Record<string, VdaDidEndpointResponse>