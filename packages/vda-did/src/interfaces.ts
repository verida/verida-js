import {
    VeridaSelfTransactionConfig,
    VeridaMetaTransactionConfig,
    CallType
  } from "@verida/web3"

export type VeridaWeb3ConfigurationOptions =
    | VeridaMetaTransactionConfig
    | VeridaSelfTransactionConfig;

/**
 * Interface for VDA-DID instance creation
 * @param identifier: DID
 * @param vdaKey: private key of DID. Used to generate signature in transactions to chains
 * @param chainNameOrId: Target chain name or chain id.
 * @param callType : VDA-DID run mode. Values from vda-did-resolver
 * @param web3Options: Web3 configuration depending on call type. Values from vda-did-resolver
 */
 export interface VdaDidConfigurationOptions {
    identifier: string;
    vdaKey: string;
    chainNameOrId?: string | number;
  
    callType: CallType;
    web3Options: VeridaWeb3ConfigurationOptions;
  }