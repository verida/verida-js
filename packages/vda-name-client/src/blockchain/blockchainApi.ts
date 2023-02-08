import {
    VeridaSelfTransactionConfig,
    VeridaMetaTransactionConfig,
    CallType,
    getVeridaContract,
    VeridaContract
} from "@verida/web3"
import { ethers } from "ethers";
import { getContractInfoForNetwork } from "./config";
import { getVeridaSignWithNonce, interpretIdentifier } from "./helpers";

/**
 * Interface for vda-name-client instance creation. Same as VDA-DID configuration
 * @param identifier: DID
 * @param signKey: private key of DID. Used to generate signature in transactions to chains
 * @param chainNameOrId: Target chain name or chain id.
 * @param callType : VDA-DID run mode. Values from vda-did-resolver
 * @param web3Options: Web3 configuration depending on call type. Values from vda-did-resolver
 */
export interface NameClientConfig {
    identifier: string;
    signKey: string;
    chainNameOrId?: string | number;

    callType: CallType;
    web3Options: VeridaSelfTransactionConfig | VeridaMetaTransactionConfig;
}

export default class BlockchainApi {

    private config: NameClientConfig
    private network: string
    private didAddress : string

    private vdaWeb3Client : VeridaContract;

    public constructor(config: NameClientConfig) {
        this.config = config

        const { address, publicKey, network } = interpretIdentifier(config.identifier)

        this.didAddress = address.toLowerCase();
        // @ts-ignore
        this.network = network || config.chainNameOrId
        const contractInfo = getContractInfoForNetwork(this.network);

        if (config.callType == 'web3' && !(<VeridaSelfTransactionConfig>config.web3Options).rpcUrl) {
            throw new Error('Web3 transactions must specify `rpcUrl` in the configuration options')
        }

        this.vdaWeb3Client = getVeridaContract(
            config.callType, 
            {...contractInfo,
            ...config.web3Options});
    }

    /**
     * Get a nonce from DIDRegistry contract
     * @returns nonce of DID
     */
     public async nonceFN() {
        const response = await this.vdaWeb3Client.nonce(this.didAddress);
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
        const signature = await this.getRegisterSignature(username, this.didAddress, this.config.signKey)
        const response = await this.vdaWeb3Client.register(username, this.didAddress, signature)

        if (response.success !== true) {
            throw new Error('Failed to register')
        }
    }

    /**
     * Unregister a username from the did address
     * @param username Name to be unregistered
     */
    public async unregister(username: string) {
        const signature = await this.getRegisterSignature(username, this.didAddress, this.config.signKey)
        const response = await this.vdaWeb3Client.unregister(username, this.didAddress, signature)

        if (response.success !== true) {
            throw new Error('Failed to unregister')
        }
    }

    /**
     * Get the username list of a DID address
     * @param did DID address to get usernames
     * @returns username list 
     */
    public async getUsernames(did: string): Promise<string[]> {
        const response = await this.vdaWeb3Client.getUserNameList(did)
        if (response.success !== true) {
            throw new Error('Failed to get usernames')
        }
        return response.data
    }

    /**
     * Return the DID address for a given username
     * @param username username registered by {@link register}
     * @returns DID address
     */
    public async getDid(username: string): Promise<string> {
        const response = await this.vdaWeb3Client.findDID(username)
        if (response.success !== true) {
            throw new Error('Failed to get the DID')
        }
        return response.data
    }

}