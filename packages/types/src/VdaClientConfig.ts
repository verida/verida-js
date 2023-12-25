import { EnvironmentType } from "./NetworkInterfaces";
import { Web3CallType, Web3SelfTransactionConfig, Web3MetaTransactionConfig } from "./Web3Interfaces";
/**
 * Interface for vda-xxx-client instance creation.
 * @param did: DID
 * @param signKey: private key of DID. Used to generate signature in transactions to chains
 * @param chainNameOrId: Target chain name or chain id.
 * @param callType : VDA-DID run mode. Values from vda-did-resolver
 * @param web3Options: Web3 configuration depending on call type. Values from vda-did-resolver
 */
export interface VdaClientConfig {
    network: EnvironmentType
    did?: string
    signKey?: string
    callType?: Web3CallType
    web3Options?: Web3SelfTransactionConfig | Web3MetaTransactionConfig
}