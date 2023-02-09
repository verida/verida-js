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
 * Interface for vda-sbt-client instance creation. Same as VDA-DID configuration
 * @param identifier: DID
 * @param signKey: private key of DID. Used to generate signature in transactions to chains
 * @param chainNameOrId: Target chain name or chain id.
 * @param callType : VDA-DID run mode. Values from vda-did-resolver
 * @param web3Options: Web3 configuration depending on call type. Values from vda-did-resolver
 */
export interface SBTClientConfig {
    identifier: string;
    signKey: string;
    chainNameOrId?: string | number;

    callType: CallType;
    web3Options: VeridaSelfTransactionConfig | VeridaMetaTransactionConfig;
}

/**
 * Interface representing the SBT information. Used to claim a SBT
 * @param sbtType Existing SBT type. Ex - "twitter"
 * @param uniqueId Unique id of SBT. For example twitter account id.
 * @param sbtURI Token URI to be set
 * @param recipient Token receiver
 * @param signedData Signature of `uniqueId`. Signed by the trusted signer
 * @param signedProof Proof for `uniqudId`
 */
export interface SBTInfo {
    sbtType: string;
    uniqueId: string;
    sbtURI: string;
    recipient: string;
    signedData: string;
    signedProof: string;
}

export default class BlockchainApi {

    private config: SBTClientConfig
    private network: string
    private didAddress : string

    private vdaWeb3Client : VeridaContract;

    public constructor(config: SBTClientConfig) {
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
     * Get a nonce from SBT contract
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
     * Return the tokenURI matched to tokenId
     * @param tokenId tokenId
     * @returns tokenURI from SBT contract
     */
    public async tokenURI(tokenId: number) {
        const response = await this.vdaWeb3Client.tokenURI(tokenId);
        if (response.data === undefined) {
            throw new Error('Error in getting tokenURI');
        }
        return response.data;
    }

    /**
     * Check whether inputed tokenId is locked
     * @param tokenId Token ID
     * @returns true if tokenID is locked
     */
    public async isLocked(tokenId: number) {
        const response = await this.vdaWeb3Client.locked(tokenId);
        if (response.data === undefined) {
            throw new Error('Error in isLocked');
        }
        return response.data;
    }

    /**
     * Get the total number of tokens
     * @returns total number of tokens minted. It includes the burnt tokens.
     */
    public async totalSupply() {
        const response = await this.vdaWeb3Client.totalSupply();
        if (response.data === undefined) {
            throw new Error('Error in totalSupply');
        }
        return response.data;
    }

    /**
     * Get the list of trusted signer addresses
     * @returns list of addresses
     */
    public async getTrustedSignerAddresses() {
        const response = await this.vdaWeb3Client.getTrustedSignerAddresses();
        if (response.data === undefined) {
            throw new Error('Error in getTrustedSignerAddresses');
        }
        return response.data;
    }

    /**
     * Claim a SBT type to requested user
     * @param did 
     * @param sbtInfo 
     * @param requestSignature 
     * @param requestProof 
     */
    public async claimSBT(
        did: string,
        sbtInfo: SBTInfo,
        requestSignature: string,
        requestProof: string
    ) {
        const response = await this.vdaWeb3Client.claimSBT(
            did,
            sbtInfo,
            requestSignature,
            requestProof
        )

        if (response.success !== true) {
            throw new Error('Failed to claim SBT')
        }
    }

    /**
     * Check whether SBT claimed for given type & uniqueId
     * @param sbtType SBT type
     * @param uniqueId Unique id for type. Ex : twitter account id
     * @returns true if SBT claimed
     */
    public async isSBTClaimed(
        sbtType: string,
        uniqueId: string
    ) {
        const response = await this.vdaWeb3Client.isSBTClaimed(sbtType, uniqueId);
        if (response.data === undefined) {
            throw new Error('Error in isSBTClaimed');
        }
        return response.data;
    }

    /**
     * Get the SBT type & uniqueId from tokenId
     * @param tokenId SBT tokenId
     * @returns string array of SBT type & uniqueId
     */
    public async tokenInfo(
        tokenId: number
    ) {
        const response = await this.vdaWeb3Client.tokenInfo(tokenId);
        if (response.data === undefined) {
            throw new Error('Error in tokenInfo');
        }
        return response.data;
    }

    /**
     * Burn SBT by tokenId. Only can burn in web3 mode.
     * Tokens claimed to the DID addresses are available to be burnt.
     * Not able to remove other's tokens.
     * @param tokenId SBT tokenId
     */
    public async burnSBT(
        tokenId: number
    ) {
        const response = await this.vdaWeb3Client.burnSBT(tokenId);
        if (response.data === undefined) {
            throw new Error('Error in burnSBT');
        }
        return response.data;
    }

    /**
     * Get the owner address of token
     * @param tokenId SBT tokenId
     * @returns owner address of the token
     */
    public async ownerOf(
        tokenId: number
    ) {
        const response = await this.vdaWeb3Client.ownerOf(tokenId);
        if (response.data === undefined) {
            throw new Error('Error in ownerOf');
        }
        return response.data;
    }
}