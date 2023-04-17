import {
    getVeridaContract,
    VeridaContract
} from "@verida/web3"
import {
    Web3SelfTransactionConfig,
    Web3MetaTransactionConfig,
    Web3CallType,
    EnvironmentType
} from '@verida/types'
import { getContractInfoForNetwork, RPC_URLS } from "./config";
import { interpretIdentifier } from "./helpers";
import { JsonRpcProvider } from '@ethersproject/providers';
import { explodeDID } from '@verida/helpers'

import { ethers, ContractFactory } from "ethers";
import EncryptionUtils from "@verida/encryption-utils";

/**
 * Interface for vda-sbt-client instance creation. Same as VDA-DID configuration
 * @param did @string DID
 * @param signKey @string Private key of DID (hex string). Used to generate signature in transactions to chains
 * @param network @string Target chain name or chain id.
 * @param callType @string 'web3' | 'gasless'
 * @param web3Options object Web3 configuration depending on call type. Same as vda-did-resolver
 */
export interface SBTClientConfig {
    network: EnvironmentType
    did?: string
    signKey?: string
    callType?: Web3CallType
    web3Options?: Web3SelfTransactionConfig | Web3MetaTransactionConfig
}

export class VeridaSBTClient {

    private config: SBTClientConfig
    private network: string
    private didAddress?: string

    private readOnly: boolean
    private vdaWeb3Client?: VeridaContract
    private contract?: ethers.Contract

    public constructor(config: SBTClientConfig) {
        if (!config.callType) {
            config.callType = 'web3'
        }

        this.config = config
        this.readOnly = true
        if (!config.web3Options) {
            config.web3Options = {}
        }

        this.network = config.network

        if (config.callType == 'web3' && !(<Web3SelfTransactionConfig>config.web3Options).rpcUrl) {
            (<Web3SelfTransactionConfig> config.web3Options).rpcUrl = <string> RPC_URLS[this.network]
        }

        if (config.did) {
            this.readOnly = false
            const { address } = explodeDID(config.did)
            this.didAddress = address.toLowerCase()

            const contractInfo = getContractInfoForNetwork(this.network)
            this.vdaWeb3Client = getVeridaContract(
                config.callType, 
                {...contractInfo,
                ...config.web3Options})
        } else {
            let rpcUrl = (<Web3SelfTransactionConfig>config.web3Options).rpcUrl
            if (!rpcUrl) {
                rpcUrl = <string> RPC_URLS[this.network]
            }

            const contractInfo = getContractInfoForNetwork(this.network)
            const provider = new JsonRpcProvider(rpcUrl)

            this.contract = ContractFactory.fromSolidity(contractInfo.abi)
                .attach(contractInfo.address)
                .connect(provider)
        }
    }

    /**
     * Get a nonce from SBT contract
     * @returns nonce of DID
     */
     public async nonceFN() {
        if (!this.vdaWeb3Client) {
            throw new Error(`Config must specify 'did' or 'signKey'`)
        }

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
        let response
        try {
            if (this.vdaWeb3Client) {
                response = await this.vdaWeb3Client.tokenURI(tokenId)
                if (response.success !== true) {
                    throw new Error(response.reason)
                }

                return response.data
            } else {
                response = await this.contract!.callStatic.tokenURI(tokenId)

                return response
            }
        } catch (err:any ) {
            const message = err.reason ? err.reason : err.message
            throw new Error(`Failed to get tokenURI for tokenId: ${tokenId} (${message})`)
        }
    }

    /**
     * Check whether inputed tokenId is locked
     * @param tokenId Token ID
     * @returns true if tokenID is locked
     */
    public async isLocked(tokenId: number) {
        let response
        try {
            if (this.vdaWeb3Client) {
                response = await this.vdaWeb3Client.locked(tokenId)
                if (response.success !== true) {

                    throw new Error(response.reason)
                }

                return response.data
            } else {
                response = await this.contract!.callStatic.locked(tokenId)

                return response
            }
        } catch (err:any ) {
            const message = err.reason ? err.reason : err.message
            throw new Error(`Failed to get locked value for tokenId: ${tokenId} (${message})`)
        }
    }

    /**
     * Get the total number of tokens
     * @returns total number of tokens minted. It includes the burnt tokens.
     */
    public async totalSupply() {
        let response
        try {
            if (this.vdaWeb3Client) {
                response = await this.vdaWeb3Client.totalSupply()
                if (response.success !== true) {
                    throw new Error(response.reason)
                }

                return response.data
            } else {
                response = await this.contract!.callStatic.totalSupply()

                return response
            }
        } catch (err:any ) {
            const message = err.reason ? err.reason : err.message
            throw new Error(`Failed to get total supply (${message})`)
        }
    }

    /**
     * Get the list of trusted signer addresses
     * @returns list of addresses
     */
    public async getTrustedSignerAddresses() {
        let response
        try {
            if (this.vdaWeb3Client) {
                response = await this.vdaWeb3Client.getTrustedSignerAddresses()
                if (response.success !== true) {
                    throw new Error(response.reason)
                }

                return response.data
            } else {
                response = await this.contract!.callStatic.getTrustedSignerAddresses()

                return response
            }
        } catch (err:any ) {
            const message = err.reason ? err.reason : err.message
            throw new Error(`Failed to get trusted signer addresses (${message})`)
        }
    }

    /**
     * Claim a SBT type to requested user
     * @param sbtType Unique type of SBT. ie: `twitter`
     * @param uniqueId Unique ID of SBT. ie: Twitter Account ID
     * @param sbtURI Token URI containing token metadata
     * @param recipientAddress Blockchain wallet address to receive the SBT (ie: 0xabc123....)
     * @param signedProof Signature generated by trusted signer that has signed a proof that this SBT can be minted (`${sbtType}-${uniqueId}-${sbtOwnerDidAddress}`]
     * @param signerContextProof This is the proof from the trusted signer's DID Document proving the DID controls the context signing key that signed the SBT data.
     */
    public async claimSBT(
        sbtType: string,
        uniqueId: string,
        sbtURI: string,
        recipientAddress: string,
        signedProof: string,
        signerContextProof: string
    ) : Promise<number> {
        if (this.readOnly || !this.config.signKey) {
            throw new Error(`Unable to submit to blockchain. In read only mode.`)
        }

        const privateKeyArray = new Uint8Array(
            Buffer.from(this.config.signKey.slice(2), "hex")
        );
        
        // Sign the blockchain request as this DID
        const nonce = await this.nonceFN()
        const requestMsg = ethers.utils.solidityPack(
            ['address', 'string', 'address', 'bytes', 'bytes', 'uint'],
            [this.didAddress, `${sbtType}${uniqueId}${sbtURI}`, recipientAddress, signedProof, signerContextProof, nonce]
        );
        const requestSignature = EncryptionUtils.signData(requestMsg, privateKeyArray)

        // Generate a poof that the DID in the SBT data is linked to this DID address
        // Normally this process is to link a DID to a signing context public key,
        // but as we are signing using the DID private key, we can just reference the
        // DID address twice.
        const requestProofMsg = `${this.didAddress}${this.didAddress}`.toLowerCase()
        const requestProof = EncryptionUtils.signData(requestProofMsg, privateKeyArray)

        const response = await this.vdaWeb3Client!.claimSBT(
            this.didAddress,
            {
                sbtType,
                uniqueId,
                sbtURI,
                recipient: recipientAddress,
                signedData: signedProof,
                // proof that signer DID controls context address that generated signedProof
                signedProof: signerContextProof
            },
            requestSignature,
            // proof that claimer DID controls context address that generated requestSignature
            requestProof
        )

        if (response.success !== true) {
            throw new Error(`Failed to claim SBT: ${response.reason}`)
        }

        const sbtClaimedEvent = response.data?.events?.find( (item: { event: string; }) => item.event === 'SBTClaimed')

        if (!sbtClaimedEvent) {
            throw new Error(`Failed to claim SBT : No SBTCliamed event`)
        }

        const tokenID : number = sbtClaimedEvent.args.tokenId.toNumber();

        return new Promise<number>((resolve) => {
            resolve(tokenID)
        })
    }

    /**
     * Check whether SBT claimed for given type & uniqueId
     * @param claimer Wallet address that owns the SBT
     * @param sbtType SBT type
     * @param uniqueId Unique id for type. Ex : twitter account id
     * @returns true if SBT claimed
     */
    public async isSBTClaimed(
        claimer: string,
        sbtType: string,
        uniqueId: string
    ) {
        let response
        try {
            if (this.vdaWeb3Client) {
                response = await this.vdaWeb3Client.isSBTClaimed(claimer, sbtType, uniqueId)
                if (response.success !== true) {
                    throw new Error(response.reason)
                }

                return response.data
            } else {
                response = await this.contract!.callStatic.isSBTClaimed(claimer, sbtType, uniqueId)

                return response
            }
        } catch (err:any ) {
            const message = err.reason ? err.reason : err.message
            throw new Error(`Failed to determine if SBT is claimed (${message})`)
        }
    }


    /**
     * Returns the claimed tokenID list of a wallet address
     * @param claimer Wallet address that owns the SBTs
     * @returns Token ID list
     */
    public async getClaimedSBTList(
        claimer: string
    ) {
        let response
        try {
            if (this.vdaWeb3Client) {
                response = await this.vdaWeb3Client.getClaimedSBTList(claimer)
                if (response.success !== true) {
                    throw new Error(response.reason)
                }

                return response.data
            } else {
                response = await this.contract!.callStatic.getClaimedSBTList(claimer)

                return response
            }
        } catch (err:any ) {
            const message = err.reason ? err.reason : err.message
            throw new Error(`Failed to get claimed SBT list for claimer: ${claimer} (${message})`)
        }
    }

    /**
     * Get the SBT type & uniqueId from tokenId
     * @param tokenId SBT tokenId
     * @returns string array of SBT type & uniqueId
     */
    public async tokenInfo(
        tokenId: number
    ) {
        let response
        try {
            if (this.vdaWeb3Client) {
                response = await this.vdaWeb3Client.tokenInfo(tokenId)
                if (response.success !== true) {
                    throw new Error(response.reason)
                }

                return response.data
            } else {
                response = await this.contract!.callStatic.tokenInfo(tokenId)

                return response
            }
        } catch (err:any ) {
            const message = err.reason ? err.reason : err.message
            throw new Error(`Failed to get token info for token: ${tokenId} (${message})`)
        }
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
        if (this.readOnly || !this.config.signKey) {
            throw new Error(`Unable to submit to blockchain. In read only mode.`)
        }

        const response = await this.vdaWeb3Client!.burnSBT(tokenId);
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
        let response
        try {
            if (this.vdaWeb3Client) {
                response = await this.vdaWeb3Client.ownerOf(tokenId)
                if (response.success !== true) {
                    throw new Error(response.reason)
                }

                return response.data
            } else {
                response = await this.contract!.callStatic.ownerOf(tokenId)

                return response
            }
        } catch (err:any ) {
            const message = err.reason ? err.reason : err.message
            throw new Error(`Failed to get token owner for token: ${tokenId} (${message})`)
        }
    }
}