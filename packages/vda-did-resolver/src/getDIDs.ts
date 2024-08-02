import { getContractInfoForBlockchainAnchor, getDefaultRpcUrl } from "@verida/vda-common";

import { JsonRpcProvider } from '@ethersproject/providers';
import { Contract } from 'ethers';
import { activeDIDCount } from "./activeDIDCount";
import { BlockchainAnchor } from '@verida/types'
  
/**
 * Call lookUp() function of DIDRegistry contract
 * @param network Verida network to retreieve DIDs for
 * @param startIndex Index to start
 * @param count Total number of results to fetch
 */
export async function getDIDs(blockchain: BlockchainAnchor, startIndex: number=0, count: number=20, mostRecent: boolean=true, rpcUrl: string | null = ''): Promise<string[]> {
    rpcUrl = rpcUrl ? rpcUrl : getDefaultRpcUrl(blockchain.toString())
    if (!rpcUrl) {
        throw new Error(`Unable to locate RPC_URL for network: ${blockchain.toString()}`)
    }

    const contractInfo = getContractInfoForBlockchainAnchor(blockchain, "didRegistry");

    // Simple read-only of the blockchain
    const provider = new JsonRpcProvider(rpcUrl);

    try {
        const contract = new Contract(contractInfo.address, contractInfo.abi.abi, provider);

        if (mostRecent) {
            // user wants most recent DIDs
            // we need to calculate the correct offset
            // Note that startIndex is indexed from the **end** of the list of DIDs
            //   so a startIndex of 0 and count of 20 means get the 20 most recent.
            const activeDidCount = await activeDIDCount(blockchain)
            startIndex = activeDidCount - startIndex - count
            if (startIndex < 0) {
                startIndex = 0
            }
        }

        const data = (await contract.callStatic.getDIDs(startIndex, count)) as string[];

        // map the raw string into the correct canonoical DID format
        return (data || []).map((did) => `did:vda:${blockchain.toString()}:${did}`)

    } catch (e: any) {
        throw new Error('Failed to get list of active DIDs');
    }

}