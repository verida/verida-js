import {
    VeridaSelfTransactionConfig,
    VeridaMetaTransactionConfig,
    CallType
} from "@verida/web3"
  
export type VeridaWeb3ConfigurationOptions =
    | VeridaMetaTransactionConfig
    | VeridaSelfTransactionConfig;

export interface NameClientConfig {
    network: string
    rpcUrl: string

    // Hex string representation of the Verida DID private key
    privateKey: string
    // Verida DID associated with the private key
    did: string

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