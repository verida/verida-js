import { EnvironmentType } from "@verida/account"
import { DIDClientConfig as BaseDIDClientConfig } from "@verida/did-client"
import { CallType, VeridaSelfTransactionConfig, VeridaMetaTransactionConfig } from "@verida/web3"

export interface NodeAccountConfig {
    privateKey: string, // or mnemonic
    environment: EnvironmentType
    didClientConfig: DIDClientConfig
    options?: any
}

export interface DIDClientConfig extends Omit<BaseDIDClientConfig, 'network'> {
    callType: CallType,
    web3Config: VeridaSelfTransactionConfig | VeridaMetaTransactionConfig,
    didEndpoints: string[]
}