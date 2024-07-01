import { VdaClientConfig } from '@verida/types'
import { ethers } from "ethers";
import { getVeridaSign } from "@verida/vda-common";
import { explodeDID } from '@verida/helpers';
import { VeridaClientBase } from '@verida/vda-client-base';

export interface ClaimType {
    reward: bigint,
    schema: string
}

export class VeridaRewardClient extends VeridaClientBase {

    protected claimTypesCache: Record<string, ClaimType> = {}

    public constructor(config: VdaClientConfig) {
        super(config, "reward");
    }

    /**
     * Get ClaimType information for given typeId
     * @param typeId - A short, lowercase, unique identifier for claim type (ie: facebook)
     * @returns Object of `ClaimType` type defined above
     */
    public async getClaimType(typeId: string) {
        let response
        typeId = typeId.toLowerCase();

        if (this.claimTypesCache[typeId]) {
            return this.claimTypesCache[typeId]
        }

        let errMsg : string | undefined = undefined;

        try {
            if (this.vdaWeb3Client) {
                response = await this.vdaWeb3Client.getClaimType(typeId);
                if (response.success) {
                    response = response.data;
                } else {
                    if (response.reason !== 'InvalidId') {
                        errMsg = response.error;
                    }
                    response = undefined;
                }
            } else {
                response = await this.contract!.callStatic.getClaimType(typeId)
            }
        } catch(err: any) {
            response = undefined;
            if (err.errorObj?.errorName !== 'InvalidId' && err.errorName !== 'InvalidId' ) {
                errMsg = err.message;
            }
        }

        if (response) {
            this.claimTypesCache[typeId] = {reward: response[0], schema: response[1]}
            return this.claimTypesCache[typeId];
        }

        if (!errMsg) {
            return undefined
        } else {
            throw new Error(`Failed to get claim type for : ${typeId} (${errMsg})`)
        }
    }

    /**
     * Return the Reward token address-Verida token associated with `VDARewardContract`
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
     * Return the `StorageNodeRegistry` contract address associated with `VDARewardContract`
     * @returns The address of `StorageNodeRegistry` contract
     */
    public async getStorageNodeContractAddress() {
        let response

        try {
            if (this.vdaWeb3Client) {
                response = await this.vdaWeb3Client.getStorageNodeContractAddress()
                response = response.data
            } else {
                response = await this.contract!.callStatic.getStorageNodeContractAddress()
            }

            return response;
        } catch (err:any ) {
            throw new Error(`Failed to get token address (${err.message})`)
        }
    }

    /**
     * Claim reward to a specified address
     * @param typeId - Unique ID of the ClaimType (ie: facebook)
     * @param hash - Uique hash from the credential (ie: 09c247n5t089247n90812798c14)
     * @param to - Reward token receiving address
     * @param proof - Proof that signature was verified by the trusted address
     */
    public async claim(
        typeId: string,
        hash: string,
        to: string,
        proof: string
    ) {
        if (this.readOnly) {
            throw new Error(`Unable to submit to blockchain. No 'signKey' provided in config.`)
        }

        const claimType = await this.getClaimType(typeId);
        if (!claimType) {
            throw new Error(`Failed to claim: Invalid type Id(${typeId})`);
        }

        const rawMsg = ethers.utils.solidityPack(
            ['string', 'string', 'string', 'address'],
            [hash, "|", claimType.schema, to]
        );

        const signature = getVeridaSign(rawMsg, this.config.signKey!);

        const response = await this.vdaWeb3Client!.claim(typeId, hash, to, signature, proof);

        if (response.success !== true) {
            throw new Error(`Failed to claim: (${response.reason})`)
        }
    }

    /**
     * 
     * @param typeId 
     * @param hash 
     * @param did 
     * @param proof 
     */
    public async claimToStorage(
        typeId: string,
        hash: string,
        proof: string,
        did = this.didAddress,
    ) {
        if (this.readOnly) {
            throw new Error(`Unable to submit to blockchain. No 'signKey' provided in config.`)
        }

        let didAddress = did!//.toLowerCase()
        console.log("claim to storage : ",did, " : ", didAddress);
        if (didAddress.match('did')) {
            const { address } = explodeDID(did!)
            didAddress = address
        }

        const claimType = await this.getClaimType(typeId);
        if (!claimType) {
            throw new Error(`Failed to claim: Invalid type Id(${typeId})`);
        }

        const rawMsg = ethers.utils.solidityPack(
            ['string', 'string', 'string', 'address'],
            [hash, "|", claimType.schema, didAddress]
        );

        const signature = getVeridaSign(rawMsg, this.config.signKey!);

        const response = await this.vdaWeb3Client!.claimToStorage(typeId, hash, didAddress, signature, proof);

        if (response.success !== true) {
            throw new Error(`Failed to claim: (${response.reason})`)
        }
    }
}