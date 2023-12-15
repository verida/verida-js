import { executeFunction } from "./utils";  
  
/**
 * Call DECIMAL() function of `StorageNodeRegistry` contract
 */
export async function getVDATokenAddress(network: string): Promise<string> {
    return await executeFunction(
        network,
        'getVDATokenAddress',
        'Failed to get Verida Token Address'
    );
}