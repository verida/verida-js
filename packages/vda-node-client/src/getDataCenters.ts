import { CONTRACT_ADDRESS, CONTRACT_ABI as abiList, RPC_URLS } from "@verida/vda-common";

import { JsonRpcProvider } from '@ethersproject/providers';
import { Contract } from 'ethers';
  
/**
 * Call getDatacenters() function of `StorageNodeRegistry` contract
 * @param ids Array of datacenterIds
 */
export async function getDataCenters(network: string, ids: number[]) {
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
    } catch (e: any) {
        throw new Error('Failed to get datacenters');
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
    } catch (e: any) {
        throw new Error('Failed to get datacenters by country');
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
    } catch (e: any) {
        throw new Error('Failed to get datacenters by region');
    }

    return data
}