/* eslint-disable prettier/prettier */
import { VeridaWeb3Config, Web3CallType } from '@verida/types'
import { VeridaContract } from './VeridaContractBase'

/**
 * Create VeridaContract instance - that is verida-web3-sdk instance
 * @param type - Smart contract interaction mode
 * @param config - Configuration to create Verida-web3-sdk instance
 * @returns VeridaContract instance
 */
export function getVeridaContract(type: Web3CallType, config: VeridaWeb3Config) {
    return new VeridaContract(
        type,
        config
    )
}

export { VeridaContract }
