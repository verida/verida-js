import {
    VeridaSelfTransactionConfig,
    VeridaMetaTransactionConfig,
    CallType
} from "@verida/web3"
  
export type VeridaWeb3ConfigurationOptions =
    | VeridaMetaTransactionConfig
    | VeridaSelfTransactionConfig;

export interface NameClientConfig {
    network: 'testnet' | 'mainnet'
    rpcUrl: string

    callType: CallType;
    web3Options: VeridaWeb3ConfigurationOptions;
}

export class NameClientError extends Error {
    public reason: string

    constructor(message: string, reason: string) {
        super(`${message}: ${reason}`)
        this.reason = reason
    }
}