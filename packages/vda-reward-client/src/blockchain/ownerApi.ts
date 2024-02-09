import { VdaClientConfig } from "@verida/types";
import { VeridaRewardClient } from "./userApi";
import { VdaVerificationUtils } from "@verida/vda-common";

export class VeridaRewardOwnerApi extends VeridaRewardClient {

    public constructor(config: VdaClientConfig) {
        super(config);
    }

    /**
     * Add a trusted signer
     * @param didAddress DID address to be added
     */
    public async addTrustedSigner(
        didAddress: string
    ) {
        await VdaVerificationUtils.addTrustedSigner.call(this, didAddress);
    }

    /**
     * Remove a trusted signer
     * @param didAddress DID address to be added
     */
    public async removeTrustedSigner(
        didAddress: string
    ) {
        await VdaVerificationUtils.removeTrustedSigner.call(this, didAddress);
    }

    /**
     * Check whether given address is a trusted signer
     * @param didAddress DID address to be checked
     * @returns true if trusted signer, otherwise false
     */
    public async isTrustedSigner(didAddress: string) {
        return await VdaVerificationUtils.isTrustedSigner.call(this, didAddress);
    }

    /**
     * @dev Add a claim type
     * @param typeId - A short, lowercase, unique identifier for claim type (ie: facebook)
     * @param rewardAmount - The amount of VDA tokens to be rewarded for successful claims
     * @param schema - The schema URI of claim type. (ie: https://common.schemas.verida.io/social/creds/facebook)
     */
    public async addClaimType(
        typeId: string,
        rewardAmount: bigint,
        schema: string
    ) {
        if (this.readOnly || !this.vdaWeb3Client) {
            throw new Error(`Unable to submit to blockchain. In read only mode.`);
        }

        const response = await this.vdaWeb3Client!.addClaimType(typeId, rewardAmount, schema);

        if (response.success !== true) {
            throw new Error(`Failed to add a claim type : ${response.reason}`);
        }

        this.claimTypesCache[typeId] = {
            reward: rewardAmount,
            schema
        };
    }

    /**
     * @dev Remove a claim type
     * @param typeId - Unique ID of the claimType
     */
    public async removeClaimType(typeId: string) {
        if (this.readOnly || !this.vdaWeb3Client) {
            throw new Error(`Unable to submit to blockchain. In read only mode.`);
        }

        const response = await this.vdaWeb3Client!.removeClaimType(typeId);

        if (response.success !== true) {
            throw new Error(`Failed to remove a claim type : ${response.reason}`);
        }

        delete this.claimTypesCache[typeId];
    }

    /**
     * @dev Update reward amount of the claim type
     * @param typeId - Unique ID of the claim type
     * @param amount - The amount of VDA tokens to be rewarded for successful claim
     */
    public async updateClaimTypeReward(
        typeId: string,
        rewardAmount: bigint,
    ) {
        if (this.readOnly || !this.vdaWeb3Client) {
            throw new Error(`Unable to submit to blockchain. In read only mode.`);
        }

        const response = await this.vdaWeb3Client!.updateClaimTypeReward(typeId, rewardAmount);

        if (response.success !== true) {
            throw new Error(`Failed to update reward : ${response.reason}`);
        }

        this.claimTypesCache[typeId].reward = rewardAmount;
    }

}