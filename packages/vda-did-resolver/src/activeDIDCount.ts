import { getContractInfoForBlockchainAnchor, getDefaultRpcUrl } from "@verida/vda-common";

import { JsonRpcProvider } from '@ethersproject/providers';
import { Contract } from 'ethers';
import { BlockchainAnchor } from "@verida/types";
  
/**
 * Call lookUp() function of DIDRegistry contract
 * @param didAddress DID address to lookup
 * @param rpcUrl URL
 */
export async function activeDIDCount(blockchain: BlockchainAnchor, rpcUrl: string | null = ''): Promise<number> {
    rpcUrl = rpcUrl ? rpcUrl : getDefaultRpcUrl(blockchain.toString())
    if (!rpcUrl) {
        throw new Error(`Unable to locate RPC_URL for network: ${blockchain.toString()}`)
    }

    // Simple read-only of the blockchain
    const contractInfo = getContractInfoForBlockchainAnchor(blockchain, "didRegistry");
    const provider = new JsonRpcProvider(rpcUrl);
    const contract = new Contract(contractInfo.address, contractInfo.abi.abi, provider);
    
    let data;
    try {
        data = (await contract.callStatic.activeDIDCount()).toNumber();
    } catch (e: any) {
        throw new Error('Failed to get number of active DIDs');
    }

    return data
}