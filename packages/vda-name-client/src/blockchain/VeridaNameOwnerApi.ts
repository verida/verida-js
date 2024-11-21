import { VdaClientConfig } from '@verida/types'
import { BigNumberish } from "ethers";
import { VeridaNameClient } from './VeridaNameClient';

export class VeridaNameOwnerApi extends VeridaNameClient {

    public constructor(config: VdaClientConfig) {
        super(config);
    }

    /**
     * Add suffix for name registering
     * @param suffix Suffix to be added
     */
    public async addSuffix(suffix: string) {
        if (this.readOnly || !this.vdaWeb3Client) {
            throw new Error(`Unable to submit to blockchain in read only mode`)
        }

        const response = await this.vdaWeb3Client!.addSuffix(suffix);

        if (response.success !== true) {
            throw new Error(`Failed to add a suffix: ${suffix} (${response.reason})`);
        }
    }

    /**
     * Update the name count limit per DID
     * @param count Name count limit to be updated
     */
    public async updateMaxNamesPerDID(count: BigNumberish) {
        if (this.readOnly || !this.vdaWeb3Client) {
            throw new Error(`Unable to submit to blockchain in read only mode`);
        }

        const response = await this.vdaWeb3Client!.updateMaxNamesPerDID(count);

        if (response.success !== true) {
            throw new Error(`Failed to update the name limit per DID: ${count} (${response.reason})`);
        }
    }

    /**
     * Set the token address for application registering
     * @param tokenAddr Token address to be set
     */
    public async setTokenAddress(tokenAddr: string) {
        if (this.readOnly || !this.vdaWeb3Client) {
            throw new Error(`Unable to submit to blockchain in read only mode`);
        }

        const response = await this.vdaWeb3Client!.setTokenAddress(tokenAddr);

        if (response.success !== true) {
            throw new Error(`Failed to set the token address: ${tokenAddr} (${response.reason})`);
        }
    }

    /**
     * Update the fee for registering an application
     * @param fee Fee to be updated
     */
    public async updateAppRegisterFee(fee: BigNumberish) {
        if (this.readOnly || !this.vdaWeb3Client) {
            throw new Error(`Unable to submit to blockchain in read only mode`);
        }

        const response = await this.vdaWeb3Client!.updateAppRegisterFee(fee);

        if (response.success !== true) {
            throw new Error(`Failed to update the app registering fee: ${fee} (${response.reason})`);
        }
    }

    /**
     * Enable/disable the app registering
     * @dev To enable the app registereing, token address and fee should be set before
     * @param isEnabled true if enabling
     */
    public async setAppRegisterEnabled(isEnabled: boolean) {
        if (this.readOnly || !this.vdaWeb3Client) {
            throw new Error(`Unable to submit to blockchain in read only mode`);
        }

        const response = await this.vdaWeb3Client!.setAppRegisterEnabled(isEnabled);

        if (response.success !== true) {
            throw new Error(`Failed to enable app registering: ${isEnabled} (${response.reason})`);
        }
    }

}