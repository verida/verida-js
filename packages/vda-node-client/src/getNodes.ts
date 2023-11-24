import { CONTRACT_ADDRESS, CONTRACT_ABI as abiList, RPC_URLS } from "@verida/vda-common";

import { JsonRpcProvider } from '@ethersproject/providers';
import { Contract } from 'ethers';
  
/**
 * Call getNodeByAddress() function of `StorageNodeRegistry` contract
 * @param didAddress DID address that is associated with the storage node
 */
export async function getNodeByAddress(network: string, didAddress: string) {
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
        data = (await contract.callStatic.getNodeByAddress(didAddress));
    } catch (err: any) {
        if (err.errorObj?.errorName === 'InvalidDIDAddress' || err.errorName === 'InvalidDIDAddress' ) {
            return undefined;
        }
        const message = err.reason ? err.reason : err.message;
        throw new Error(`Failed to get node by DID address (${message})`);
    }
    
    return data;
}

/**
 * Call getNodeByEndpoint() function of `StorageNodeRegistry` contract
 * @param endpointUri The storage node endpoint
 */
export async function getNodeByEndpoint(network: string, endpointUri: string) {
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
        data = (await contract.callStatic.getNodeByEndpoint(endpointUri));
    } catch (err: any) {
        if (err.errorObj?.errorName === 'InvalidEndpointUri' || err.errorName === 'InvalidEndpointUri' ) {
            return undefined;
        }
        const message = err.reason ? err.reason : err.message;
        throw new Error(`Failed to get node by endpointUri (${message})`);
    }
    
    return data;
}

/**
 * Call getNodesByCountry() function of `StorageNodeRegistry` contract
 * @param countryCode Unique two-character string code
 */
export async function getNodesByCountry(network: string, countryCode: string) {
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
        data = (await contract.callStatic.getNodesByCountry(countryCode));
    } catch (err: any) {
        const message = err.reason ? err.reason : err.message;
        throw new Error(`Failed to get nodes by country (${message})`);
    }
    
    return data;
}

/**
 * Call getNodesByRegion() function of `StorageNodeRegistry` contract
 * @param regionCode Unique region string code
 */
export async function getNodesByRegion(network: string, regionCode: string) {
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
        data = (await contract.callStatic.getNodesByRegion(regionCode));
    } catch (err: any) {
        const message = err.reason ? err.reason : err.message;
        throw new Error(`Failed to get nodes by region (${message})`);
    }
    
    return data;
}