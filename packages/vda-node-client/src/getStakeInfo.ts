import { executeFunction } from "./utils";
  
/**
 * Call isStakingRequired() function of `StorageNodeRegistry` contract
 * @returns The value of required status
 */
export async function isStakingRequired(network: string) {
    return await executeFunction(
        network,
        'isStakingRequired',
        'Failed to check staking required'
    );
}

/**
 * Call getStakePerSlot() function of `StorageNodeRegistry` contract
 * @returns Required token amount for one slot
 */
export async function getStakePerSlot(network: string) {
    return await executeFunction(
        network,
        'getStakePerSlot',
        'Failed to get stake per slot'
    );
}

/**
 * Call getSlotCountRange() function of `StorageNodeRegistry` contract
 * @returns Array of min and max value
 */
export async function getSlotCountRange(network: string) {
    return await executeFunction(
        network,
        'getSlotCountRange',
        'Failed to get slot count range'
    );
}

/**
 * Call isWithdrawalEnabled() function of `StorageNodeRegistry` contract
 * @returns The status of withdrawal enabled
 */
export async function isWithdrawalEnabled(network: string) {
    return await executeFunction(
        network,
        'isWithdrawalEnabled',
        'Failed to check withdrawal enabled'
    );
}