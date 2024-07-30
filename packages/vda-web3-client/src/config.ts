/* eslint-disable prettier/prettier */
import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from 'ethers'
import { JsonRpcProvider, Provider } from '@ethersproject/providers'
import { BlockchainAnchor, Web3ContractInfo } from '@verida/types'
import { BLOCKCHAIN_CHAINIDS } from '@verida/vda-common'

/**
 * Should contain provider
 * { provider: <provider instance> }
 * 
 * Otherwise, this configuration should contain rpcUrl, and one of `blockchainAnchor` and `chainId`
 * ex: { rpcUrl: <RPC_URL>, blockchainAnchor: BlockchainAnchor.POLAMOY}
 * ex: { rpcUrl: <RPC_URL>, chainId: '0x89'}
 * 
 * @param provider Provider supported by `ethers`
 * @param rpcUrl RPC that is used in blockchain transactions
 * @param blockchainAnchor Verida supported blockchain {@link BlockchainAnchor}
 * @param chainId Blockchain Id. ex: `0x89` for Polygon mainnet
 */
export interface ProviderConfiguration {
    provider?: Provider;

    rpcUrl?: string;
    blockchainAnchor?: BlockchainAnchor;
    chainId?: string | number;
}


/**
 * Check whether parameter contains gas configuration option
 * @param obj parameter to be checked
 * @returns true if contains, otherwise false
 */
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
export function getContractInstance(conf: ProviderConfiguration & Web3ContractInfo): Contract {
    let provider: Provider | undefined = conf.provider;
    if (!provider) {
        if (conf.rpcUrl) {
            if (!conf.chainId && !conf.blockchainAnchor) {
                throw new Error('Should provide \'chainId\' or \'blockchainAnchor\' in the configuration')
            }

            let chainIdRaw = conf.chainId;
            if (!chainIdRaw) {
                chainIdRaw = BLOCKCHAIN_CHAINIDS[conf.blockchainAnchor!];
            }

            const chainId = chainIdRaw ? BigNumber.from(chainIdRaw).toNumber() : chainIdRaw
            provider = new JsonRpcProvider(conf.rpcUrl, chainId || 'any')
        } else {
            throw new Error('Should provide \'rpcUrl\' in the configuration');
        }
    }

    const contract = new Contract(conf.address, conf.abi.abi, provider)

    return contract
}
