import { CONTRACT_ADDRESS, CONTRACT_ABI as abiList, RPC_URLS } from "@verida/vda-common";

import { JsonRpcProvider } from '@ethersproject/providers';
import { Contract } from 'ethers';
  
/**
 * Call getBalance() function of `StorageNodeRegistry` contract
 * @param didAddress DID address 
 * @returns Amount of staked token
 */
export async function getBalance(network: string, didAddress: string) {
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
        data = (await contract.callStatic.getBalance(didAddress));
    } catch (err: any) {
        const message = err.reason ? err.reason : err.message;
        throw new Error(`Failed to get balance (${message})`);
    }
    
    return data;
}

/**
 * Call excessTokenAmount() function of `StorageNodeRegistry` contract
 * @param didAddress DID address
 * @return Excess token amount
 */
export async function excessTokenAmount(network: string, didAddress: string) {
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
        data = (await contract.callStatic.excessTokenAmount(didAddress));
    } catch (err: any) {
        const message = err.reason ? err.reason : err.message;
        throw new Error(`Failed to get excess token amount (${message})`);
    }
    
    return data;
}