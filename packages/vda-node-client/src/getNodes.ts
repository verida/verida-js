import { executeFunction } from "./utils";
import { EnumStatus } from "@verida/types";

/**
 * Check `name` is registered as node name
 * @param network One of Verida supported network
 * @param name Name to be checked
 * @returns true if registered, otherwise false
 */
export async function isRegisteredNodeName(network: string, name: string) {
    return await executeFunction(
        network,
        'isRegisteredNodeName',
        'Failed to check node name',
        name
    );
}

/**
 * Check `didAddress` is registered as node address
 * @param network One of Verida supported network
 * @param didAddress DID address to be checked
 * @returns true if registered, otherwise false
 */
export async function isRegisteredNodeAddress(network: string, didAddress: string) {
    return await executeFunction(
        network,
        'isRegisteredNodeAddress',
        'Failed to check node address',
        didAddress
    );
}

/**
 * Check `endpointUri` is registered as node endpoint
 * @param network One of Verida supported network
 * @param endpointUri EndpointUri to be checked
 * @returns true if registered, otherwise false
 */
export async function isRegisteredNodeEndpoint(network: string, endpointUri: string) {
    return await executeFunction(
        network,
        'isRegisteredNodeEndpoint',
        'Failed to check node endpoint',
        endpointUri
    );
}

/**
 * Get a node by name
 * @param network One of Verida supported network
 * @param name Node name
 * @returns A storage node if name is registered. Otherwise rejected
 */
export async function getNodeByName(network: string, name: string) {
    return await executeFunction(
        network,
        'getNodeByName',
        'Failed to get node by name',
        name
    );
}

/**
 * Get a node by DID address
 * @param network One of Verida supported network
 * @param didAddress Node address
 * @returns A storage node if address is registered. Otherwise rejected
 */
export async function getNodeByAddress(network: string, didAddress: string) {
    return await executeFunction(
        network,
        'getNodeByAddress',
        'Failed to get node by address',
        didAddress
    );
}

/**
 * Get a node by endpointUri
 * @param network One of Verida supported network
 * @param endpointUri EndpointUri of a storage node
 * @returns A storage node if endpointUri is registered. Otherwise rejected
 */
export async function getNodeByEndpoint(network: string, endpointUri: string) {
    return await executeFunction(
        network,
        'getNodeByEndpoint',
        'Failed to get node by endpoint',
        endpointUri
    );
}

/**
 * Get nodes by country and status
 * @param network Target network
 * @param countryCode Country code of nodes
 * @param status Status of nodes
 */
export async function getNodesByCountryCode(
    network: string, 
    countryCode: string, 
    status?: EnumStatus) {
    if (status === undefined) {
        return await executeFunction(
            network,
            'getNodesByCountryCode',
            'Failed to get nodes by country',
            countryCode
        );
    } else {
        return await executeFunction(
            network,
            'getNodesByCountryCodeAndStatus',
            'Failed to get nodes by country and status',
            countryCode,
            status
        );
    }
}

/**
 * Get nodes by region and status
 * @param network Target network
 * @param regionCode Region code of nodes
 * @param status Status of nodes
 */
export async function getNodesByRegionCode(
    network: string, 
    regionCode: string, 
    status?: EnumStatus) {
    if (status === undefined) {
        return await executeFunction(
            network,
            'getNodesByRegionCode',
            'Failed to get nodes by region',
            regionCode
        );
    } else {
        return await executeFunction(
            network,
            'getNodesByRegionCodeAndStatus',
            'Failed to get nodes by region and status',
            regionCode,
            status
        );
    }
}

/**
 * Get nodes by status
 * @param network Target network
 * @param status Status of nodes
 */
export async function getNodesByStatus(
    network: string, 
    status: EnumStatus) {
    return await executeFunction(
        network,
        'getNodesByStatus',
        'Failed to get nodes by status',
        status
    );
}