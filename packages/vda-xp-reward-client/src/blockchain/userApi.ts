import { VdaClientConfig, Web3SelfTransactionConfig } from '@verida/types'
import { ethers, BytesLike, BigNumber } from "ethers";
import { getContractInfoForBlockchainAnchor, getVeridaSign } from "@verida/vda-common";
import { VeridaClientBase } from "@verida/vda-client-base";
import { VeridaTokenClient } from '@verida/vda-token-client';

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
export class VeridaXPRewardClient extends VeridaClientBase{

    public constructor(config: VdaClientConfig) {
        super(config, "xpReward");
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
        );

        if (response.success !== true) {
            throw new Error(`Failed to claim xp: (${response.reason})`)
        }
    }

    /**
     * Deposit verida token to the `XPRewardContract` for `claimXPReward()` function calls
     * In face, this function is for owner to deposit token to the contract.
     * By the way, any others also can deposit tokens instead of owner
     * @param amount Amount of token to be deposited
     */
    public async depositToken(amount: BigNumber) {
        if (this.readOnly) {
            throw new Error(`Unable to submit to blockchain. No 'signKey' provided in config.`)
        }

        // Check the Token contract address is the same as the Verida token contract in the `vda-common`
        const contractTokenAddress = await this.getTokenAddress();
        const vdaTokenAddress = getContractInfoForBlockchainAnchor(this.blockchainAnchor, "token").address;

        // if (contractTokenAddress.toLowerCase() !== vdaTokenAddress.toLowerCase()) {
        //     throw new Error(`Reward token address in the contract not matched with the Verida Token address`);
        // }

        const xpRewardContractAddress = getContractInfoForBlockchainAnchor(this.blockchainAnchor, "xpReward").address;

        const web3Options: Web3SelfTransactionConfig = <Web3SelfTransactionConfig>this.config.web3Options;

        const vdaTokenApi = await VeridaTokenClient.CreateAsync({
            blockchainAnchor: this.blockchainAnchor,
            privateKey: web3Options.privateKey,
            rpcUrl: web3Options.rpcUrl
        });

        try {
            await vdaTokenApi.transfer(xpRewardContractAddress, amount);
        } catch (e: any) {
            console.log("Errr");
        }
    }
}