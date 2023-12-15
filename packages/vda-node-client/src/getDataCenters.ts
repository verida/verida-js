import { BigNumberish } from "ethers";
import { executeFunction } from "./utils";
import { EnumStatus } from "@verida/types";

/**
 * Call getDatacenters() function of `StorageNodeRegistry` contract
 * @param ids Array of datacenterIds
 */
export async function isRegisteredDataCenterName(network: string, name: string) {
    return await executeFunction(
        network,
        'isRegisteredDataCenterName',
        'Failed to check datacenter name',
        name
    );
}
  
/**
 * Call getDatacenters() function of `StorageNodeRegistry` contract
 * @param ids Array of datacenterIds
 */
export async function getDataCenters(network: string, ids: BigNumberish[]) {
    return await executeFunction(
        network,
        'getDataCenters',
        'Failed to get datacenters by id',
        ids
    );
}

/**
 * Call getDatacentersByName() function of `StorageNodeRegistry` contract
 * @param names Array of name
 */
export async function getDataCentersByName(network: string, names: string[]) {
    return await executeFunction(
        network,
        'getDataCentersByName',
        'Failed to get datacenters by name',
        names
    );
}

/**
 * Call getDatacentersByCountry() function of `StorageNodeRegistry` contract
 * @param network Target network
 * @param countryCode Country code of data centers
 * @param status Status of data centers
 */
export async function getDataCentersByCountry(
    network: string, 
    countryCode: string, 
    status?: EnumStatus) {
    if (status === undefined) {
        return await executeFunction(
            network,
            'getDataCentersByCountry',
            'Failed to get datacenters by country',
            countryCode
        );
    } else {
        return await executeFunction(
            network,
            'getDataCentersByCountryAndStatus',
            'Failed to get datacenters by country and status',
            countryCode,
            status
        );
    }
}

/**
 * Call getDatacentersByRegion() function of `StorageNodeRegistry` contract
 * @param network Target network
 * @param regionCode Region code of data centers
 * @param status Status of data centers
 */
export async function getDataCentersByRegion(
    network: string, 
    regionCode: string, 
    status?: EnumStatus) {
    if (status === undefined) {
        return await executeFunction(
            network,
            'getDataCentersByRegion',
            'Failed to get datacenters by region',
            regionCode
        );
    } else {
        return await executeFunction(
            network,
            'getDataCentersByRegionAndStatus',
            'Failed to get datacenters by region and status',
            regionCode,
            status
        );
    }
}