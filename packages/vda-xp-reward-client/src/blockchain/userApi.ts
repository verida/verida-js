import {
    getVeridaContract,
    VeridaContract
} from "@verida/web3"
import { Web3SelfTransactionConfig, VdaClientConfig } from '@verida/types'
import { ethers, Contract, BytesLike } from "ethers";
import { getContractInfoForNetwork, RPC_URLS, getVeridaSign, getVeridaSignWithNonce } from "@verida/vda-common";
import { JsonRpcProvider } from '@ethersproject/providers';
import { explodeDID } from '@verida/helpers'
import EncryptionUtils from "@verida/encryption-utils";

/**
 * This is the claim information
 * 
 * @interface ClaimXPInfo
 * @member {string} typeId - the Proof type. Ex : `gamer31`
 * @member {string} uniqueId - Unique Id of the proof.
 * @member {number} issueYear - Issued year of the proof
 * @member {number} issueMonth - Issued month of the proof
 * @member {bigint} xp - Value of xp
 * @member {BytesLike} signature - Proof signed by a trusted signer
 */
export interface ClaimXPInfo {
    typeId: string,
    uniqueId?: string,
    issueYear: number,
    issueMonth: number,
    xp: bigint,
    signature: BytesLike,
}

/**
 * This is a client class that interacts with the `VDAXPReward` contract of Verida
 */
export class VeridaXPRewardClient {

    protected config: VdaClientConfig
    protected network: string
    protected didAddress?: string

    protected vdaWeb3Client? : VeridaContract

    protected readOnly: boolean
    protected contract?: ethers.Contract

    public constructor(config: VdaClientConfig) {
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

        const contractInfo = getContractInfoForNetwork("VDAXPReward", this.network)

        if (config.did) {
            this.readOnly = false
            const { address } = explodeDID(config.did)
            this.didAddress = address.toLowerCase()
            
            this.vdaWeb3Client = getVeridaContract(
                config.callType, 
                {...contractInfo,
                ...config.web3Options})
        } else {
            let rpcUrl = (<Web3SelfTransactionConfig>config.web3Options).rpcUrl
            if (!rpcUrl) {
                rpcUrl = <string> RPC_URLS[this.network]
            }

            const provider = new JsonRpcProvider(rpcUrl)

            this.contract = new Contract(contractInfo.address, contractInfo.abi.abi, provider)
        }
    }

    /**
     * Get a nonce from VDAXPReward contract
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
     * Return the Reward token address-Verida token associated with `VDAXPRewardContract`
     * @returns The address of token contract
     */
    public async getTokenAddress() {
        let response

        try {
            if (this.vdaWeb3Client) {
                response = await this.vdaWeb3Client.getTokenAddress()
                response = response.data
            } else {
                response = await this.contract!.callStatic.getTokenAddress()
            }

            return response;
        } catch (err:any ) {
            throw new Error(`Failed to get token address (${err.message})`)
        }
    }

    /**
     * Return the denominator of conversion rate for `Verida XP` to `Verida token`
     * @returns The denominator for conversion rate
     */
    public async getRateDenominator() : Promise<BigInt> {
        let response

        try {
            if (this.vdaWeb3Client) {
                response = await this.vdaWeb3Client.getRateDenominator()
                response = response.data
            } else {
                response = await this.contract!.callStatic.getRateDenominator()
            }

            return BigInt(response);
        } catch (err:any ) {
            throw new Error(`Failed to get rate denominator (${err.message})`)
        }
    }

    /**
     * Return the conversion rate for `Verida XP` to `Verida token`
     * @returns The conversion rate divided by the rate denominator
     */
    public async getConversionRate() : Promise<number> {
        let response
        let denominator

        denominator = Number(await this.getRateDenominator());

        try {
            if (this.vdaWeb3Client) {
                response = await this.vdaWeb3Client.getConversionRate()
                response = response.data

            } else {
                response = await this.contract!.callStatic.getConversionRate()
            }

            response = Number(response / denominator);

            return response;
        } catch (err:any ) {
            throw new Error(`Failed to get covnersion rate (${err.message})`)
        }
    }

    /**
     * Claim reward to a specified address
     * @param to - Reward token recipient wallet address
     * @param claims - Array of claim information
     */
    public async claimXPReward(
        to: string,
        claims: ClaimXPInfo[]
    ) {
        if (this.readOnly) {
            throw new Error(`Unable to submit to blockchain. No 'signKey' provided in config.`)
        }

        // Create `requestSignature` and `requestProof`
        const nonce = await this.nonceFN();
        let requestMsg = ethers.utils.solidityPack(
            ['address', 'address'],
            [this.didAddress, to]
        );
        for (let i = 0; i < claims.length; i++) {
            requestMsg = ethers.utils.solidityPack(
                ['bytes', 'bytes'],
                [requestMsg, claims[i].signature]
            );
        }
        requestMsg = ethers.utils.solidityPack(
            ['bytes', 'uint'],
            [requestMsg, nonce]
        );
        
        const requestSignature = getVeridaSign(requestMsg, this.config.signKey!);
        const proofMsg = `${this.didAddress}${this.didAddress}`.toLowerCase();
        const requestProof = getVeridaSign(proofMsg, this.config.signKey!);

        const response = await this.vdaWeb3Client!.claimXPReward(
            this.didAddress,
            to,
            claims,
            requestSignature,
            requestProof
        )

        if (response.success !== true) {
            throw new Error(`Failed to claim xp: (${response.reason})`)
        }
    }
}