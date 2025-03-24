import { VdaClientConfig } from '@verida/types'
import { ethers, BigNumberish } from "ethers";
import { VeridaNodeManager } from "./userApi";
import { VdaVerificationUtils } from "@verida/vda-common";

export class VeridaNodeOwnerApi extends VeridaNodeManager {

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
     * Add a data centre to the network.
     * @param name Data centre name
     * @param countryCode Unique two-character string code
     * @param regionCode Unique region string code
     * @param lat Latitude value. [-90, 90]
     * @param long Longitude value. [-180, 180]
     */
    public async addDataCentre(
        name: string,
        countryCode: string,
        regionCode: string,
        lat: number,
        long: number
    ) {
        const CONTRACT_DECIMAL = await this.getContractDecimal();
        if (this.readOnly || !this.config.signKey) {
            throw new Error(`Unable to submit to blockchain in read only mode`)
        }

        const response = await this.vdaWeb3Client!.addDataCentre({
            name,
            countryCode,
            regionCode,
            lat: ethers.utils.parseUnits(lat.toString(), CONTRACT_DECIMAL),
            long: ethers.utils.parseUnits(long.toString(), CONTRACT_DECIMAL),
        });
        
        if (response.success !== true) {
            throw new Error(`Failed to add a data centre: ${response.reason}`);
        }

    }

    /**
     * Remove a data centre by id
     * @param datacentreId datacentreId created by `addDataCentre()` function
     */
    public async removeDataCentre(datacentreId: BigNumberish) {
        if (this.readOnly || !this.config.signKey) {
            throw new Error(`Unable to submit to blockchain in read only mode`)
        }

        const response = await this.vdaWeb3Client!.removeDataCentre(datacentreId);
        
        if (response.success !== true) {
            throw new Error(`Failed to remove a data centre: ${response.reason}`);
        }

    }

    /**
     * Remove a data centre by name
     * @param name datacentre name to be removed
     */
    public async removeDataCentreByName(name: string) {
        if (this.readOnly || !this.config.signKey) {
            throw new Error(`Unable to submit to blockchain in read only mode`)
        }

        const response = await this.vdaWeb3Client!.removeDataCentreByName(name);
        
        if (response.success !== true) {
            throw new Error(`Failed to remove a data centre by name: ${response.reason}`);
        }

    }

    /**
     * Update the status of staking required
     * @param isRequired The new value to be updated
     */
    public async setStakingRequired(isRequired: boolean) {
        if (this.readOnly || !this.config.signKey) {
            throw new Error(`Unable to submit to blockchain in read only mode`)
        }

        const response = await this.vdaWeb3Client!.setStakingRequired(isRequired);
        
        if (response.success !== true) {
            throw new Error(`Failed to set staking required: ${response.reason}`);
        }

    }

    /**
     * Update the `STAKE_PER_SLOT` value of contract
     * @param stakeAmount The new value to be updated
     */
    public async updateStakePerSlot(stakeAmount: BigNumberish) {
        if (this.readOnly || !this.config.signKey) {
            throw new Error(`Unable to submit to blockchain in read only mode`)
        }

        const response = await this.vdaWeb3Client!.updateStakePerSlot(stakeAmount);
        
        if (response.success !== true) {
            throw new Error(`Failed to set StakePerSlot: ${response.reason}`);
        }
    }

    /**
     * Update the minmum of `STAKE_PER_SLOT` value
     * @param minSlots The new value to be updated
     */
    public async updateMinSlotCount(minSlots: BigNumberish) {
        if (this.readOnly || !this.config.signKey) {
            throw new Error(`Unable to submit to blockchain in read only mode`)
        }

        const response = await this.vdaWeb3Client!.updateMinSlotCount(minSlots);
        
        if (response.success !== true) {
            throw new Error(`Failed to update minimum slot count: ${response.reason}`);
        }
    }

    /**
     * Update the maximum of `STAKE_PER_SLOT` value
     * @param maxSlots The new value to be updated
     */
    public async updateMaxSlotCount(maxSlots: BigNumberish) {
        if (this.readOnly || !this.config.signKey) {
            throw new Error(`Unable to submit to blockchain in read only mode`)
        }

        const response = await this.vdaWeb3Client!.updateMaxSlotCount(maxSlots);
        
        if (response.success !== true) {
            throw new Error(`Failed to update maximum slot count: ${response.reason}`);
        }
    }
    
    /**
     * Update the fee for logging a node issue
     * @param newFee New fee value to be set.
     */
    public async updateNodeIssueFee(newFee: BigNumberish) {
        if (this.readOnly || !this.config.signKey) {
            throw new Error(`Unable to submit to blockchain in read only mode`)
        }

        const response = await this.vdaWeb3Client!.updateNodeIssueFee(newFee);
        
        if (response.success !== true) {
            throw new Error(`Failed to update fee to log a node issue : ${response.reason}`);
        }
    }

    /**
     * Withdraw the VDA tokens that was deposited by `logNodeIssue()` function
     * @param to Receiving address
     * @param amount Amount to be withdrawn
     */
    public async withdrawIssueFee(to: string, amount: BigNumberish) {
        if (this.readOnly || !this.config.signKey) {
            throw new Error(`Unable to submit to blockchain in read only mode`)
        }

        const response = await this.vdaWeb3Client!.withdrawIssueFee(to, amount);
        
        if (response.success !== true) {
            throw new Error(`Failed to withdraw issue fee : ${response.reason}`);
        }
    }

    /**
     * Update the `SAME_NODE_LOG_DURATION` value
     * @param value Time in seconds unit
     */
    public async updateSameNodeLogDuration(value: BigNumberish) {
        if (this.readOnly || !this.config.signKey) {
            throw new Error(`Unable to submit to blockchain in read only mode`)
        }

        const response = await this.vdaWeb3Client!.updateSameNodeLogDuration(value);
        
        if (response.success !== true) {
            throw new Error(`Failed to update log duration per same node : ${response.reason}`);
        }
    }

    /**
     * Update the `LOG_LIMIT_PER_DAY` value
     * @param value Log limit count per day
     */
    public async updateLogLimitPerDay(value: BigNumberish) {
        if (this.readOnly || !this.config.signKey) {
            throw new Error(`Unable to submit to blockchain in read only mode`)
        }

        const response = await this.vdaWeb3Client!.updateLogLimitPerDay(value);
        
        if (response.success !== true) {
            throw new Error(`Failed to update log limit per day : ${response.reason}`);
        }
    }

    /**
     * Slash the tokens
     * @param nodeAddress DID address of the node to be slashed
     * @param reasonCode Reascon code to be slashed
     * @param amount Token amount to be slashed
     * @param moreInfoUrl On-chain pointer to where more information can be fournd about this slashing
     */
    public async slash(
        nodeAddress: string, 
        reasonCode: BigNumberish, 
        amount: BigNumberish,
        moreInfoUrl: string) 
    {
        if (this.readOnly || !this.config.signKey) {
            throw new Error(`Unable to submit to blockchain in read only mode`)
        }

        const response = await this.vdaWeb3Client!.slash(nodeAddress, reasonCode, amount, moreInfoUrl);
        
        if (response.success !== true) {
            throw new Error(`Failed to slash : ${response.reason}`);
        }
    }

    /**
     * Add a reason code
     * @param reasonCode Code to be added 
     * @param description Description of the code
     */
    public async addReasonCode(reasonCode: BigNumberish, description: string) {
        if (this.readOnly || !this.config.signKey) {
            throw new Error(`Unable to submit to blockchain in read only mode`)
        }

        const response = await this.vdaWeb3Client!.addReasonCode(reasonCode, description);
        
        if (response.success !== true) {
            throw new Error(`Failed to add the reason code: ${response.reason}`);
        }
    }

    /**
     * Disable a reason code
     * @param reasonCode Code to be disabled
     */
    public async disableReasonCode(reasonCode: BigNumberish) {
        if (this.readOnly || !this.config.signKey) {
            throw new Error(`Unable to submit to blockchain in read only mode`)
        }

        const response = await this.vdaWeb3Client!.disableReasonCode(reasonCode);
        
        if (response.success !== true) {
            throw new Error(`Failed to disable the reason code: ${response.reason}`);
        }
    }

    /**
     * Update the description of a registered reason code
     * @param reasonCode Code to be updated
     * @param description Description to be updated
     */
    public async updateReasonCodeDescription(reasonCode: BigNumberish, description: string) {
        if (this.readOnly || !this.config.signKey) {
            throw new Error(`Unable to submit to blockchain in read only mode`)
        }

        const response = await this.vdaWeb3Client!.updateReasonCodeDescription(reasonCode, description);
        
        if (response.success !== true) {
            throw new Error(`Failed to update the description of the reason code: ${response.reason}`);
        }
    }

    /**
     * Update the status of staking required
     * @param isRequired The new value to be updated
     */
    public async setWithdrawalEnabled(isEnabled: boolean) {
        if (this.readOnly || !this.config.signKey) {
            throw new Error(`Unable to submit to blockchain in read only mode`)
        }

        const response = await this.vdaWeb3Client!.setWithdrawalEnabled(isEnabled);
        
        if (response.success !== true) {
            throw new Error(`Failed to set withdrawal enabled: ${response.reason}`);
        }

    }

    /**
     * Start 2-step ownership transfer
     * @param to New owenr address
     */
    public async transferOwnership(to: string) {
        if (this.readOnly || !this.config.signKey) {
            throw new Error(`Unable to submit to blockchain in read only mode`)
        }

        const response = await this.vdaWeb3Client!.transferOwnership(to);
        
        if (response.success !== true) {
            throw new Error(`Failed to transfer ownership: ${response.reason}`);
        }
    }
}