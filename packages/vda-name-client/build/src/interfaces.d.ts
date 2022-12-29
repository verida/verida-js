import { VeridaSelfTransactionConfig, VeridaMetaTransactionConfig, CallType } from "@verida/web3";
export declare type VeridaWeb3ConfigurationOptions = VeridaMetaTransactionConfig | VeridaSelfTransactionConfig;
export interface NameClientConfig {
    network: string;
    rpcUrl: string;
    privateKey: string;
    did: string;
    callType: CallType;
    web3Options: VeridaWeb3ConfigurationOptions;
}
