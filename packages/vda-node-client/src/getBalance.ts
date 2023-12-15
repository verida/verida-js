import { executeFunction } from "./utils";
  
/**
 * Call getBalance() function of `StorageNodeRegistry` contract
 * @param didAddress DID address 
 * @returns Amount of staked token
 */
export async function getBalance(network: string, didAddress: string) {
    return await executeFunction(network, 'getBalance', 'Failed to get balance', didAddress);
}

/**
 * Call excessTokenAmount() function of `StorageNodeRegistry` contract
 * @param didAddress DID address
 * @return Excess token amount
 */
export async function excessTokenAmount(network: string, didAddress: string) {
    return await executeFunction(network, 'excessTokenAmount', 'Failed to get excess token amount', didAddress);
}