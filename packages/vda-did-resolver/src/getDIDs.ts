import { CONTRACT_ADDRESS, CONTRACT_ABI as abiList, RPC_URLS } from "@verida/vda-common";

import { JsonRpcProvider } from '@ethersproject/providers';
import { Contract } from 'ethers';
import { activeDIDCount } from "./activeDIDCount";
  
/**
 * Call lookUp() function of DIDRegistry contract
 * @param network Verida network to retreieve DIDs for
 * @param startIndex Index to start
 * @param count Total number of results to fetch
 */
export async function getDIDs(network: string, startIndex: number = 0, count: number=20, mostRecent: boolean=true): Promise<string[]> {
    const rpcUrl = RPC_URLS[network]
    if (!rpcUrl) {
        throw new Error(`Unable to locate RPC_URL for network: ${network}`)
    }

    // Simple read-only of the blockchain
    const contractABI = abiList["VeridaDIDRegistry"];
    const provider = new JsonRpcProvider(rpcUrl);
    const address = CONTRACT_ADDRESS["VeridaDIDRegistry"][network];

    if (!address) {
        throw new Error(`Empty contract address for network-${network}`)
    }

    const contract = new Contract(address, contractABI.abi, provider);

    if (mostRecent) {
        const activeDids = await activeDIDCount(network)
        startIndex = activeDids - startIndex - count
    }
    
    let data;
    try {
        data = await contract.callStatic.getDIDs(startIndex, count)
    } catch (e: any) {
        throw new Error('Failed to get list of active DIDs');
    }

    return data
}