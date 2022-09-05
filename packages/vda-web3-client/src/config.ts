/* eslint-disable prettier/prettier */
import { Signer } from '@ethersproject/abstract-signer'

import { BigNumber } from '@ethersproject/bignumber'
import { Contract, ContractFactory } from '@ethersproject/contracts'
import { JsonRpcProvider, Provider } from '@ethersproject/providers'

import { knownNetworks } from './constants'

/** Web3 SDK running mode */
export type CallType = 'web3' | 'gasless'

/** Contract Info. Used for 'web3' mode */
export interface ContractInfo {
    abi: any
    address: string
}

/**
 * Configuration type for Web3 mode
 *
 * signer - optional - a Signer that sign the blockchain transactions. If a 'signer' is not provided, then 'contract' with an attached signer need to be used to make transactions
 * provider - optional - a web3 provider. At least one of `signer`,`provider`, or `rpcUrl` is required
 * rpcUrl - optinal - a JSON-RPC URL that can be used to connect to an ethereum network. At least one of `signer`, `provider`, or `rpcUrl` is required
 * web3 - optional - Can use provider or web.currentProvider as a provider.
 */
export interface VeridaSelfTransactionConfig {
    signer?: Signer
    privateKey?: string
    provider?: Provider
    rpcUrl?: string
    web3?: any
}

/** Configuration type for gasless mode */
export interface VeridaMetaTransactionConfig {
    veridaKey : string
    serverConfig : VeridaGaslessRequestConfig
    postConfig : VeridaGaslessPostConfig
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

/**
 * Returns Contract class instance of ethers library
 * This is used in web3 mode only - self transaction mode.
 *
 * @param conf Provider configuration to
 * @returns Contract instance
 */
export function getContractForNetwork(conf: ProviderConfiguration & ContractInfo): Contract {
    let provider: Provider = conf.provider || conf.web3?.currentProvider
    if (!provider) {
        if (conf.rpcUrl) {
            const chainIdRaw = conf.chainId ? conf.chainId : knownNetworks[conf.name || '']
            const chainId = chainIdRaw ? BigNumber.from(chainIdRaw).toNumber() : chainIdRaw
            provider = new JsonRpcProvider(conf.rpcUrl, chainId || 'any')
        } else {
        throw new Error(`invalid_config: No web3 provider could be determined for network ${conf.name || conf.chainId}`)
        }
    }

    const contract: Contract = ContractFactory.fromSolidity(conf.abi)
        .attach(conf.registry)
        .connect(provider)

    return contract
}
