import { BigNumberish } from "ethers";
import { executeFunction } from "./utils";
import { EnumStatus } from "@verida/types";

/**
 * Call getDataCentres() function of `StorageNodeRegistry` contract
 * @param ids Array of datacentreIds
 */
export async function isRegisteredDataCentreName(network: string, name: string) {
    return await executeFunction(
        network,
        'isRegisteredDataCentreName',
        'Failed to check datacentre name',
        name
    );
}
  
/**
 * Call getDataCentres() function of `StorageNodeRegistry` contract
 * @param ids Array of datacentreIds
 */
export async function getDataCentresById(network: string, ids: BigNumberish[]) {
    return await executeFunction(
        network,
        'getDataCentresById',
        'Failed to get datacentres by id',
        ids
    );
}

/**
 * Call getDataCentresByName() function of `StorageNodeRegistry` contract
 * @param names Array of name
 */
export async function getDataCentresByName(network: string, names: string[]) {
    return await executeFunction(
        network,
        'getDataCentresByName',
        'Failed to get datacentres by name',
        names
    );
}

/**
 * Call getDataCentresByCountry() function of `StorageNodeRegistry` contract
 * @param network Target network
 * @param countryCode Country code of data centres
 * @param status Status of data centres
 */
export async function getDataCentresByCountryCode(
    network: string, 
    countryCode: string, 
    status?: EnumStatus) {
    if (status === undefined) {
        return await executeFunction(
            network,
            'getDataCentresByCountryCode',
            'Failed to get datacentres by country',
            countryCode
        );
    } else {
        return await executeFunction(
            network,
            'getDataCentresByCountryCodeAndStatus',
            'Failed to get datacentres by country and status',
            countryCode,
            status
        );
    }
}

/**
 * Call getDataCentresByRegion() function of `StorageNodeRegistry` contract
 * @param network Target network
 * @param regionCode Region code of data centres
 * @param status Status of data centres
 */
export async function getDataCentresByRegionCode(
    network: string, 
    regionCode: string, 
    status?: EnumStatus) {
    if (status === undefined) {
        return await executeFunction(
            network,
            'getDataCentresByRegionCode',
            'Failed to get datacentres by region',
            regionCode
        );
    } else {
        return await executeFunction(
            network,
            'getDataCentresByRegionCodeAndStatus',
            'Failed to get datacentres by region and status',
            regionCode,
            status
        );
    }
}