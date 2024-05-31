import { VdaClientConfig } from "@verida/types";
import { VeridaXPRewardClient } from "./userApi";
import { VdaVerificationUtils } from "@verida/vda-common";

export class VeridaXPRewardOwnerApi extends VeridaXPRewardClient {

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
     * @dev Set the denominator for rate values
     * @param denominator - new value to be set
     */
    public async setRateDenominator(denominator: bigint) {
        if (this.readOnly || !this.vdaWeb3Client) {
            throw new Error(`Unable to submit to blockchain. In read only mode.`);
        }

        const response = await this.vdaWeb3Client!.setRateDenominator(denominator);

        if (response.success !== true) {
            throw new Error(`Failed to set rate denominator : ${response.reason}`);
        }
    }

    /**
     * @dev  Update the XP-VDA conversion rate
     * @param newRate - New value to be updated. This is the float value. 
     *      Should be set in the contract after multiplied with the `rateDenominator`
     */
    public async setConversionRate(newRate: number) {
        if (this.readOnly || !this.vdaWeb3Client) {
            throw new Error(`Unable to submit to blockchain. In read only mode.`);
        }

        const denominator = await this.getRateDenominator();
        const rate: bigint = BigInt(Number(denominator) * newRate);

        const response = await this.vdaWeb3Client!.setConversionRate(rate);

        if (response.success !== true) {
            throw new Error(`Failed to set conversion rate : ${response.reason}`);
        }
    }

    /**
     * @dev Withdraw tokens
     * @param to - Recipient wallet address
     * @param amount - Token amount to be withdrawn
     */
    public async withdraw(
        to: string,
        amount: bigint,
    ) {
        if (this.readOnly || !this.vdaWeb3Client) {
            throw new Error(`Unable to submit to blockchain. In read only mode.`);
        }

        const response = await this.vdaWeb3Client!.withdraw(to, amount);

        if (response.success !== true) {
            throw new Error(`Failed to withdraw : ${response.reason}`);
        }
    }
}