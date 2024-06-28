import {
    getVeridaContract,
    VeridaContract
} from "@verida/web3"
import { Web3SelfTransactionConfig, VdaClientConfig, Network, BlockchainAnchor, TContractNames } from '@verida/types'
import { ethers, Contract } from "ethers";
import { getContractInfoForVeridaNetwork, NETWORK_DEFINITIONS, getDefaultRpcUrl } from "@verida/vda-common";
import { JsonRpcProvider } from '@ethersproject/providers';
import { explodeDID } from '@verida/helpers'

export class VeridaClientBase {

    protected config: VdaClientConfig
    protected network: Network
    protected blockchainAnchor: BlockchainAnchor;
    protected didAddress?: string

    protected vdaWeb3Client? : VeridaContract

    protected readOnly: boolean
    protected contract?: ethers.Contract
    
    public constructor(config: VdaClientConfig, contractName: TContractNames) {
        if (!config.callType) {
            config.callType = 'web3'
        }

        this.config = config
        this.readOnly = true
        if (!config.web3Options) {
            config.web3Options = {}
        }

        this.network = config.network
        this.blockchainAnchor = NETWORK_DEFINITIONS[this.network].anchoredBlockchain;

        if (config.callType == 'web3' && !(<Web3SelfTransactionConfig>config.web3Options).rpcUrl) {
            (<Web3SelfTransactionConfig> config.web3Options).rpcUrl = getDefaultRpcUrl(this.blockchainAnchor)!
        }

        const contractInfo = getContractInfoForVeridaNetwork(contractName, this.network)

        if (config.did) {
            this.readOnly = false
            const { address } = explodeDID(config.did)
            this.didAddress = address;//.toLowerCase()

            this.vdaWeb3Client = getVeridaContract(
                config.callType, 
                {...contractInfo,
                ...config.web3Options,
                network: this.network})
        } else {
            let rpcUrl = (<Web3SelfTransactionConfig>config.web3Options).rpcUrl
            if (!rpcUrl) {
                rpcUrl = getDefaultRpcUrl(this.blockchainAnchor)!
            }

            const provider = new JsonRpcProvider(rpcUrl)

            this.contract = new Contract(contractInfo.address, contractInfo.abi.abi, provider)
        }
    }
}