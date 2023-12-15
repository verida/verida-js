import { BigNumberish } from "ethers";
import { executeFunction } from "./utils";  
/**
 * Call getNodeIssueFee() function of `StorageNodeRegistry` contract
 * @returns Amount of Verida token for fee
 */
export async function getNodeIssueFee(network: string) {
    return await executeFunction(
        network,
        'getNodeIssueFee',
        'Failed to get node issue fee'
    );
}

/**
 * Call getSameNodeLogDuration() function of `StorageNodeRegistry` contract
 * @returns Same node log duration in seconds
 */
export async function getSameNodeLogDuration(network: string) {
    return await executeFunction(
        network,
        'getSameNodeLogDuration',
        'Failed to get log duration for same node'
    );
}

/**
 * Call getLogLimitPerDay() function of `StorageNodeRegistry` contract
 * @returns Same node log duration in seconds
 */
export async function getLogLimitPerDay(network: string) {
    return await executeFunction(
        network,
        'getLogLimitPerDay',
        'Failed to get log limit per day'
    );
}

/**
 * Call getReasonCodeList() function of `StorageNodeRegistry` contract
 * @returns List of reason codes
 */
export async function getReasonCodeList(network: string) {
    return await executeFunction(
        network,
        'getReasonCodeList',
        'Failed to get reason code list'
    );
}

/**
 * Call getReasonCodeDescription() function of `StorageNodeRegistry` contract
 * @returns List of reason codes
 */
export async function getReasonCodeDescription(network: string, reasonCode: BigNumberish) {
    return await executeFunction(
        network,
        'getReasonCodeDescription',
        'Failed to get reason code description',
        reasonCode
    );
}