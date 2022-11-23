import { CONTRACT_ADDRESSES } from "./config";

import { JsonRpcProvider } from '@ethersproject/providers';
import { ContractFactory } from 'ethers';
  
/**
 * Call lookUp() function of DIDRegistry contract
 * @param didAddress DID address to lookup
 * @param rpcUrl URL
 */
export async function lookup(didAddress: string, network: string, rpcUrl: string) : Promise<string[]> {
    // @todo: Alex perform lookup() on chain, without using VdaDid
    // Simple read-only of the blockchain

    const contractABI = require(`./abi/DidRegistry.json`);
    const provider = new JsonRpcProvider(rpcUrl);
    const address = CONTRACT_ADDRESSES[network];

    const contract = ContractFactory.fromSolidity(contractABI)
        .attach(address!)
        .connect(provider);

    let data = [];
    try {
        data = await contract.callStatic.lookup(didAddress);
    } catch (e: any) {
        // console.log('Error in transaction', e);
        throw new Error('Failed to look up');
    }

    return data[1]
}