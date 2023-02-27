import {
    getVeridaContract,
    VeridaContract
} from "@verida/web3"
import {
    Web3SelfTransactionConfig,
    Web3MetaTransactionConfig,
    Web3CallType
} from '@verida/types'
import { ethers, ContractFactory } from "ethers";
import { getContractInfoForNetwork } from "./config";
import { getVeridaSignWithNonce, interpretIdentifier } from "./helpers";
import { JsonRpcProvider } from '@ethersproject/providers';

/**
 * Interface for vda-name-client instance creation. Same as VDA-DID configuration
 * @param identifier: DID
 * @param signKey: private key of DID. Used to generate signature in transactions to chains
 * @param chainNameOrId: Target chain name or chain id.
 * @param callType : VDA-DID run mode. Values from vda-did-resolver
 * @param web3Options: Web3 configuration depending on call type. Values from vda-did-resolver
 */
export interface NameClientConfig {
    identifier?: string;
    signKey?: string;
    chainNameOrId?: string | number;

    callType: Web3CallType;
    web3Options: Web3SelfTransactionConfig | Web3MetaTransactionConfig;
}

export class VeridaNameClient {

    private config: NameClientConfig
    private network: string
    private didAddress?: string

    private vdaWeb3Client? : VeridaContract

    private readOnly: boolean
    private contract?: ethers.Contract
    // Key = username, Value = DID
    private usernameCache: Record<string, string> = {}

    public constructor(config: NameClientConfig) {
        this.config = config
        this.readOnly = true
        if (!config.web3Options) {
            config.web3Options = {}
        }

        if (config.callType == 'web3' && !(<Web3SelfTransactionConfig>config.web3Options).rpcUrl) {
            throw new Error('Web3 transactions must specify `rpcUrl` in the configuration options')
        }

        if (config.identifier) {
            this.readOnly = false
            const { address, network } = interpretIdentifier(config.identifier)
            // @ts-ignore
            this.network = network || config.chainNameOrId
            this.didAddress = address.toLowerCase();

            const contractInfo = getContractInfoForNetwork(this.network)

            this.vdaWeb3Client = getVeridaContract(
                config.callType, 
                {...contractInfo,
                ...config.web3Options});
        } else {
            if (!config.chainNameOrId) {
                throw new Error(`Config must specify 'chainNameOrId' or 'identifier'`)
            }

            const rpcUrl = (<Web3SelfTransactionConfig>config.web3Options).rpcUrl
            this.network = config.chainNameOrId.toString()
            const contractInfo = getContractInfoForNetwork(this.network)
            const provider = new JsonRpcProvider(rpcUrl);

            this.contract = ContractFactory.fromSolidity(contractInfo.abi)
                .attach(contractInfo.address)
                .connect(provider);
        }
    }

    /**
     * Get a nonce from DIDRegistry contract
     * @returns nonce of DID
     */
     public async nonceFN() {
        if (!this.vdaWeb3Client) {
            throw new Error(`Config must specify 'chainNameOrId' or 'identifier'`)
        }

        const response = await this.vdaWeb3Client!.nonce(this.didAddress);
        if (response.data === undefined) {
            throw new Error('Error in getting nonce');
        }
        return response.data;
    }

    /**
     * Get a signature for {@link BlockchainApi#register} function
     * @param name Name to register
     * @param did DID address
     * @param signKey Verida account key to generate signature
     * @returns Signature
     */
     private async getRegisterSignature (
        name: string,
        did: string,
        signKey: string
    ) {
        let rawMsg = ethers.utils.solidityPack(['string', 'address'], [name, did]);
        return getVeridaSignWithNonce(rawMsg, signKey, await this.nonceFN());
    };

    /**
     * Register a username to the did address
     * @param username Name to register
     */
    public async register(username: string) {
        if (this.readOnly) {
            throw new Error(`Unable to submit to blockchain. No 'identifier' provided in config.`)
        }

        if (!this.config.signKey) {
            throw new Error(`Unable to submit to blockchain. No 'signKey' provided in config.`)
        }

        const signature = await this.getRegisterSignature(username, this.didAddress!, this.config.signKey!)
        const response = await this.vdaWeb3Client!.register(username, this.didAddress!, signature)

        if (response.success !== true) {
            throw new Error(`Failed to register: ${response.reason}`)
        }

        this.usernameCache[username] = `did:vda:${this.network}:${this.didAddress}`
    }

    /**
     * Unregister a username from the did address
     * @param username Name to be unregistered
     */
    public async unregister(username: string) {
        if (this.readOnly) {
            throw new Error(`Unable to submit to blockchain. No 'identifier' provided in config.`)
        }

        if (!this.config.signKey) {
            throw new Error(`Unable to submit to blockchain. No 'signKey' provided in config.`)
        }

        const signature = await this.getRegisterSignature(username, this.didAddress!, this.config.signKey!)
        const response = await this.vdaWeb3Client!.unregister(username, this.didAddress, signature)

        if (response.success !== true) {
            throw new Error('Failed to unregister')
        }

        delete this.usernameCache[username]
    }

    /**
     * Get the username list of a DID address
     * @param did DID address to get usernames
     * @returns username list 
     */
    public async getUsernames(did: string): Promise<string[]> {
        let response
        if (this.vdaWeb3Client) {
            response = await this.vdaWeb3Client.getUserNameList(did)
            if (response.success !== true) {
                throw new Error(`Failed to get usernames for did: ${did}`)
            }

            return response.data
        } else {
            response = await this.contract!.callStatic.getUserNameList(did)

            if (!response) {
                throw new Error(`Failed to get usernames for did: ${did}`)
            }

            return response
        }
    }

    /**
     * Return the DID address for a given username
     * @param username username registered by {@link register}
     * @returns DID address
     */
    public async getDid(username: string): Promise<string> {
        if (this.usernameCache[username]) {
            return this.usernameCache[username]
        }

        let response
        if (this.vdaWeb3Client) {
            response = await this.vdaWeb3Client.findDID(username)

            if (response.success !== true) {
                throw new Error(`Failed to locate the DID for username: ${username}`)
            }

            response = response.data
        } else {
            response = await this.contract!.callStatic.findDID(username)
            if (!response) {
                throw new Error(`Failed to locate the DID for username: ${username}`)
            }
        }

        const did = `did:vda:${this.network}:${response}`
        this.usernameCache[username] = did
        return did
    }

}