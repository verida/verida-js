/* eslint-disable prettier/prettier */
import { CallType, ContractInfo, VeridaSelfTransactionConfig, VeridaMetaTransactionConfig, VeridaWeb3Config } from './config'
import { VeridaContract } from './VeridaContractBase'

/**
 * Create VeridaContract instance - that is verida-web3-sdk instance
 * @param type - Smart contract interaction mode
 * @param config - Configuration to create Verida-web3-sdk instance
 * @returns VeridaContract instance
 */
export function VeridaContractInstance(type: CallType, config: VeridaWeb3Config) {
    return new VeridaContract(
        type,
        config
    )
}

export { CallType, VeridaContract, VeridaWeb3Config }
export { ContractInfo, VeridaSelfTransactionConfig, VeridaMetaTransactionConfig }
