import {
    getVeridaContract,
    VeridaContract
} from "@verida/web3"
import {
    Web3SelfTransactionConfig,
    Web3MetaTransactionConfig,
    Web3CallType
} from '@verida/types'
import { getContractInfoForNetwork } from "./config";
import { interpretIdentifier } from "./helpers";

import { ethers } from 'ethers';
import EncryptionUtils from "@verida/encryption-utils";

/**
 * Interface for vda-sbt-client instance creation. Same as VDA-DID configuration
 * @param identifier @string DID
 * @param signKey @string Private key of DID (hex string). Used to generate signature in transactions to chains
 * @param chainNameOrId @string Target chain name or chain id.
 * @param callType @string 'web3' | 'gasless'
 * @param web3Options object Web3 configuration depending on call type. Same as vda-did-resolver
 */
export interface SBTClientConfig {
    identifier: string;
    signKey: string;
    chainNameOrId?: string | number;

    callType: Web3CallType;
    web3Options: Web3SelfTransactionConfig | Web3MetaTransactionConfig;
}

export class VeridaSBTClient {

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

        if (config.callType == 'web3' && !(<Web3SelfTransactionConfig>config.web3Options).rpcUrl) {
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
     * @param sbtType Unique type of SBT. ie: `twitter`
     * @param uniqueId Unique ID of SBT. ie: twitter account id
     * @param sbtURI Token URI containing token metadata
     * @param recipient Blockchain wallet to receive the SBT (ie: 0xabc123....)
     * @param signedData Signature of `uniqueId`, signed by a trusted signer
     * @param signedProof Context proof for `uniqueId`. This is the proof from the trusted signer's DID Document proving the DID controls the context signing key.
     */
    public async claimSBT(
        sbtType: string,
        uniqueId: string,
        sbtURI: string,
        recipient: string,
        signedData: string,
        signedProof: string
    ) {
        const privateKeyArray = new Uint8Array(
            Buffer.from(this.config.signKey.slice(2), "hex")
        );
        
        const nonce = await this.nonceFN()
        const requestMsg = ethers.utils.solidityPack(
            ['address', 'string', 'address', 'bytes', 'bytes', 'uint'],
            [this.didAddress, `${sbtType}${uniqueId}${sbtURI}`, recipient, signedData, signedProof, nonce]
        );
        const requestSignature = EncryptionUtils.signData(requestMsg, privateKeyArray)

        const requestProofMsg = `${this.didAddress}${this.didAddress}`.toLowerCase()
        const requestProof = EncryptionUtils.signData(requestProofMsg, privateKeyArray)

        const response = await this.vdaWeb3Client.claimSBT(
            this.didAddress,
            {
                sbtType,
                uniqueId,
                sbtURI,
                recipient,
                signedData,
                signedProof
            },
            requestSignature,
            requestProof
        )

        if (response.success !== true) {
            throw new Error(`Failed to claim SBT: ${response.reason}`)
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