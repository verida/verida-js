import { CONTRACT_ADDRESS, CONTRACT_ABI as abiList, RPC_URLS } from "@verida/vda-common";

import { JsonRpcProvider } from '@ethersproject/providers';
import { BigNumberish, Contract } from 'ethers';


/**
 * Call getDatacenters() function of `StorageNodeRegistry` contract
 * @param ids Array of datacenterIds
 */
export async function isDataCenterNameRegistered(network: string, name: string) {
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
        data = (await contract.callStatic.isDataCenterNameRegistered(name));
    } catch (e: any) {
        throw new Error('Failed to check datacenter name');
    }

    return data
}
  
/**
 * Call getDatacenters() function of `StorageNodeRegistry` contract
 * @param ids Array of datacenterIds
 */
export async function getDataCenters(network: string, ids: BigNumberish[]) {
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
        data = (await contract.callStatic.getDataCenters(ids));
    } catch (err: any) {
        const message = err.reason ? err.reason : err.message;
        throw new Error(`Failed to get datacenters (${message})`);
    }

    return data
}

/**
 * Call getDatacentersByName() function of `StorageNodeRegistry` contract
 * @param names Array of name
 */
export async function getDataCentersByName(network: string, names: string[]) {
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
        data = (await contract.callStatic.getDataCentersByName(names));
    } catch (err: any) {
        const message = err.reason ? err.reason : err.message;
        throw new Error(`Failed to get datacenters by names (${message})`);
    }

    return data
}

/**
 * Call getDatacentersByCountry() function of `StorageNodeRegistry` contract
 * @param ids Array of datacenterIds
 */
export async function getDataCentersByCountry(network: string, countryCode: string) {
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
        data = (await contract.callStatic.getDataCentersByCountry(countryCode));
    } catch (err: any) {
        const message = err.reason ? err.reason : err.message;
        throw new Error(`Failed to get datacenters by country (${message})`);
    }

    return data
}

/**
 * Call getDatacentersByRegion() function of `StorageNodeRegistry` contract
 * @param ids Array of datacenterIds
 */
export async function getDataCentersByRegion(network: string, regionCode: string) {
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
        data = (await contract.callStatic.getDataCentersByRegion(regionCode));
    } catch (err: any) {
        const message = err.reason ? err.reason : err.message;
        throw new Error(`Failed to get datacenters by region (${message})`);
    }

    return data
}