import { VdaClientConfig } from '@verida/types'
import { ethers, BigNumberish } from "ethers";
import { VeridaNodeManager } from "./userApi";

export class VeridaNodeOwnerApi extends VeridaNodeManager {

    public constructor(config: VdaClientConfig) {
        super(config);
    }
    
    /**
     * Add a data center to the network.
     * @param name Data center name
     * @param countryCode Unique two-character string code
     * @param regionCode Unique region string code
     * @param lat Latitude value. [-90, 90]
     * @param long Longitude value. [-180, 180]
     */
    public async addDatacenter(
        name: string,
        countryCoude: string,
        regionCode: string,
        lat: number,
        long: number
    ) {
        const CONTRACT_DECIMAL = await this.getContractDecimal();
        if (this.readOnly || !this.config.signKey) {
            throw new Error(`Unable to submit to blockchain. In read only mode.`)
        }

        const response = await this.vdaWeb3Client!.addDatacenter({
            name,
            countryCoude,
            regionCode,
            lat: ethers.utils.parseUnits(lat.toString(), CONTRACT_DECIMAL),
            long: ethers.utils.parseUnits(long.toString(), CONTRACT_DECIMAL),
        });
        
        if (response.success !== true) {
            throw new Error(`Failed to add a data center: ${response.reason}`);
        }

    }

    /**
     * Remove a data center
     * @param datacenterId datacenterId created by `addDatacenter()` function
     */
    public async removeDatacenter(datacenterId: BigNumberish) {
        if (this.readOnly || !this.config.signKey) {
            throw new Error(`Unable to submit to blockchain. In read only mode.`)
        }

        const response = await this.vdaWeb3Client!.removeDatacenter(datacenterId);
        
        if (response.success !== true) {
            throw new Error(`Failed to remove a data center: ${response.reason}`);
        }

    }

    /**
     * Update the status of staking required
     * @param isRequired The new value to be updated
     */
    public async setStakingRequired(isRequired: boolean) {
        if (this.readOnly || !this.config.signKey) {
            throw new Error(`Unable to submit to blockchain. In read only mode.`)
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
            throw new Error(`Unable to submit to blockchain. In read only mode.`)
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
            throw new Error(`Unable to submit to blockchain. In read only mode.`)
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
            throw new Error(`Unable to submit to blockchain. In read only mode.`)
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
            throw new Error(`Unable to submit to blockchain. In read only mode.`)
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
            throw new Error(`Unable to submit to blockchain. In read only mode.`)
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
            throw new Error(`Unable to submit to blockchain. In read only mode.`)
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
            throw new Error(`Unable to submit to blockchain. In read only mode.`)
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
            throw new Error(`Unable to submit to blockchain. In read only mode.`)
        }

        const response = await this.vdaWeb3Client!.slash(nodeAddress, reasonCode, amount, moreInfoUrl);
        
        if (response.success !== true) {
            throw new Error(`Failed to slash : ${response.reason}`);
        }
    }
}