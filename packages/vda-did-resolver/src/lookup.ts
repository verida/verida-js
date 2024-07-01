import { getContractInfoForBlockchainAnchor, getDefaultRpcUrl, mapDidNetworkToBlockchainAnchor } from "@verida/vda-common";

import { JsonRpcProvider } from '@ethersproject/providers';
import { Contract } from 'ethers';
  
/**
 * Call lookUp() function of DIDRegistry contract
 * @param didAddress DID address to lookup
 * @param rpcUrl URL
 */
export async function lookup(didAddress: string, network: string, rpcUrl?: string) : Promise<string[]> { 
    const blockchain = mapDidNetworkToBlockchainAnchor(network)
    if (!blockchain) {
        throw new Error(`Empty contract address for network-${network}`)
    }

    if (!rpcUrl) {
        getDefaultRpcUrl(network)
        if (!rpcUrl) {
            throw new Error(`Unable to locate RPC_URL for network: ${blockchain.toString()}`)
        }
    }

    const contractInfo = getContractInfoForBlockchainAnchor(blockchain, "didRegistry");
    const provider = new JsonRpcProvider(rpcUrl);
    const contract = new Contract(contractInfo.address, contractInfo.abi.abi, provider);
    
    let data = [];
    try {
        data = await contract.callStatic.lookup(didAddress);
    } catch (e: any) {
        throw new Error('DID not found');
    }

    return data[1]
}