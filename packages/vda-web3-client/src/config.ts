/* eslint-disable prettier/prettier */
import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from '@ethersproject/contracts'
import { JsonRpcProvider, Provider } from '@ethersproject/providers'
import { knownNetworks } from './constants'
import { Web3ContractInfo, Web3ProviderConfiguration, Web3GasConfiguration } from '@verida/types'

export function isVeridaWeb3GasConfiguration(obj : Object) {
    return ('maxFeePerGas' in obj)
        || ('maxPriorityFeePerGas' in obj)
        || ('gasLimit' in obj)
        || ('gasPrice' in obj)
        || ('eip1559Mode' in obj)
        || ('eip1559gasStationUrl' in obj);
}


/**
 * Returns Contract class instance of ethers library
 * This is used in web3 mode only - self transaction mode.
 *
 * @param conf Provider configuration to
 * @returns Contract instance
 */
export function getContractForNetwork(conf: Web3ProviderConfiguration & Web3ContractInfo): Contract {
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

    const contract = new Contract(conf.registry, conf.abi.abi, provider)

    return contract
}
