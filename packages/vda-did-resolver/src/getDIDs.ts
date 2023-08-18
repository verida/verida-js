import { CONTRACT_ADDRESS, RPC_URLS, CONTRACT_ABI as abiList } from "@verida/vda-common";

import { JsonRpcProvider } from '@ethersproject/providers';
import { Contract } from 'ethers';
import { activeDIDCount } from "./activeDIDCount";
import { EnvironmentType } from '@verida/types'
  
/**
 * Call lookUp() function of DIDRegistry contract
 * @param network Verida network to retreieve DIDs for
 * @param startIndex Index to start
 * @param count Total number of results to fetch
 */
export async function getDIDs(network: EnvironmentType, startIndex: number=0, count: number=20, mostRecent: boolean=true): Promise<string[]> {
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

    try {
        const contract = new Contract(address, contractABI.abi, provider);

        if (mostRecent) {
            // user wants most recent DIDs
            // we need to calculate the correct offset
            // Note that startIndex is indexed from the **end** of the list of DIDs
            //   so a startIndex of 0 and count of 20 means get the 20 most recent.
            const activeDidCount = await activeDIDCount(network)
            startIndex = activeDidCount - startIndex - count
        }
        
        const data = (await contract.callStatic.getDIDs(startIndex, count)) as string[];

        // map the raw string into the correct canonoical DID format
        return (data || []).map((did) => `did:vda:${network}:${did}`)

    } catch (e: any) {
        throw new Error('Failed to get list of active DIDs');
    }

}