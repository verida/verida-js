import { CONTRACT_ADDRESS, CONTRACT_ABI as abiList, RPC_URLS } from "@verida/vda-common";

import { JsonRpcProvider } from '@ethersproject/providers';
import { Contract } from 'ethers';
  
/**
 * Call getNodeIssueFee() function of `StorageNodeRegistry` contract
 * @returns Amount of Verida token for fee
 */
export async function getNodeIssueFee(network: string) {
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
        data = (await contract.callStatic.getNodeIssueFee());
    } catch (err: any) {
        const message = err.reason ? err.reason : err.message;
        throw new Error(`Failed to get node issue fee (${message})`);
    }
    
    return data;
}

/**
 * Call getSameNodeLogDuration() function of `StorageNodeRegistry` contract
 * @returns Same node log duration in seconds
 */
export async function getSameNodeLogDuration(network: string) {
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
        data = (await contract.callStatic.getSameNodeLogDuration());
    } catch (err: any) {
        const message = err.reason ? err.reason : err.message;
        throw new Error(`Failed to get log duration for same node (${message})`);
    }
    
    return data;
}

/**
 * Call getLogLimitPerDay() function of `StorageNodeRegistry` contract
 * @returns Same node log duration in seconds
 */
export async function getLogLimitPerDay(network: string) {
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
        data = (await contract.callStatic.getLogLimitPerDay());
    } catch (err: any) {
        const message = err.reason ? err.reason : err.message;
        throw new Error(`Failed to get log limit per day (${message})`);
    }

    return data;
}