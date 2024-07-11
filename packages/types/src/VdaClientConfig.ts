import { BlockchainAnchor } from "./NetworkInterfaces";
import { Web3CallType, Web3SelfTransactionConfig, Web3MetaTransactionConfig } from "./Web3Interfaces";
/**
 * Interface for vda-xxx-client instance creation.
 * @param blockchainAnchor : Verida supported chain. ex : "polpos", "polamoy" {@link BlockchainAnchor}
 *  In self transactio mode, this value should be the same as the `blockchainAnchor` of the @{@link Web3SelfTransactionConfig}
 * @param did: DID
 * @param signKey: private key of DID. Used to generate signature in transactions to chains
 * @param callType : VDA-DID run mode. Values from vda-did-resolver
 * @param web3Options: Web3 configuration depending on call type. Values from vda-did-resolver
 */
export interface VdaClientConfig {
    blockchainAnchor: BlockchainAnchor
    did?: string
    signKey?: string
    callType?: Web3CallType
    web3Options?: Web3SelfTransactionConfig | Web3MetaTransactionConfig
}