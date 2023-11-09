import { CONTRACT_ADDRESS, CONTRACT_ABI as abiList, RPC_URLS } from "@verida/vda-common";

import { JsonRpcProvider } from '@ethersproject/providers';
import { Contract } from 'ethers';
  
/**
 * Call DECIMAL() function of `StorageNodeRegistry` contract
 */
export async function getContractDecimal(network: string): Promise<number> {
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
        data = (await contract.callStatic.DECIMAL()).toNumber();
    } catch (e: any) {
        throw new Error('Failed to get DECIMAL');
    }

    return data
}