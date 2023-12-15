import { CONTRACT_ADDRESS, CONTRACT_ABI as abiList, RPC_URLS } from "@verida/vda-common";

import { JsonRpcProvider } from '@ethersproject/providers';
import { Contract } from 'ethers';

/**
 * Execute view function 
 * @param network Network name to test. Should be one of the Verida supported network names
 * @param functionName Function name to be called
 * @param errMsg Error message to be returned when error occured
 * @param params Parameters of the function
 * @returns Value of function
 */
export async function executeFunction(
    network: string, 
    functionName: string, 
    errMsg:string, 
    ...params: any[] ) {

    const rpcUrl = RPC_URLS[network]
    if (!rpcUrl) {
        throw new Error(`Unable to locate RPC_URL for network: ${network}`)
    }

    // Simple read-only of the blockchain

    const contractABI = abiList["StorageNodeRegistry"];
    const provider = new JsonRpcProvider(rpcUrl);
    const address = CONTRACT_ADDRESS["StorageNodeRegistry"][network];

    if (!address) {
        throw new Error(`Empty contract address for network-${network}`)
    }

    const contract = new Contract(address, contractABI.abi, provider);

    let data;
    try {
        data = (await contract.callStatic[functionName](...params));
    } catch (err: any) {
        const message = err.reason ? err.reason : err.message;
        throw new Error(`${errMsg} (${message})`);
    }
    
    return data;
}
