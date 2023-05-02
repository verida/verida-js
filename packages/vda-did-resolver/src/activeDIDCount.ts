import { CONTRACT_ADDRESS, CONTRACT_ABI as abiList } from "@verida/vda-common";

import { JsonRpcProvider } from '@ethersproject/providers';
import { Contract } from 'ethers';
  
/**
 * Call lookUp() function of DIDRegistry contract
 * @param didAddress DID address to lookup
 * @param rpcUrl URL
 */
export async function activeDIDCount(network: string, rpcUrl: string) : Promise<number> {
    // Simple read-only of the blockchain

    const contractABI = abiList["VeridaDIDRegistry"];
    const provider = new JsonRpcProvider(rpcUrl);
    const address = CONTRACT_ADDRESS["VeridaDIDRegistry"][network];

    if (!address) {
        throw new Error(`Empty contract address for network-${network}`)
    }

    const contract = new Contract(address, contractABI.abi, provider);
    
    let data;
    try {
        data = (await contract.callStatic.activeDIDCount()).toNumber();
    } catch (e: any) {
        throw new Error('Failed to get number of active DIDs');
    }

    return data
}