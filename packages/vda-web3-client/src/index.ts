/* eslint-disable prettier/prettier */
import { CallType, ContractInfo, VeridaSelfTransactionConfig, VeridaMetaTransactionConfig, VeridaWeb3Config, VeridaWeb3GasConfiguration } from './config'
import { VeridaContract, VdaTransactionResult } from './VeridaContractBase'

/**
 * Create VeridaContract instance - that is verida-web3-sdk instance
 * @param type - Smart contract interaction mode
 * @param config - Configuration to create Verida-web3-sdk instance
 * @returns VeridaContract instance
 */
export function getVeridaContract(type: CallType, config: VeridaWeb3Config) {
    return new VeridaContract(
        type,
        config
    )
}

export { CallType, VdaTransactionResult, VeridaContract, VeridaWeb3Config, VeridaWeb3GasConfiguration }
export { ContractInfo, VeridaSelfTransactionConfig, VeridaMetaTransactionConfig }
