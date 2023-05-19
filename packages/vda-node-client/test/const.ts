import { Wallet } from "ethers";
import { DID_LIST } from "@verida/vda-common-test";
import { IStorageNode } from "../src/index"

// Storage Node registered in the contract
export const REGISTERED_NODES = [
    {
        endpointUri: 'https://1',
        countryCode: 'us',
        regionCode: 'north america',
        datacenterId: 1,
        lat: -90,
        long: -180
    },
    {
        endpointUri: 'https://2',
        countryCode: 'us',
        regionCode: 'north america',
        datacenterId: 2,
        lat: -88.5,
        long: 10.436
    },
    {
        endpointUri: 'https://3',
        countryCode: 'uk',
        regionCode: 'europe',
        datacenterId: 3,
        lat: 40,
        long: 120.467
    }
]
export const REGISTERED_USERS = [
    new Wallet(DID_LIST[0].privateKey),
    new Wallet(DID_LIST[1].privateKey),
    new Wallet(DID_LIST[2].privateKey),
]

export const compareNodeData = (org: any, result: IStorageNode) => {
    let ret = false;
    try {
        ret = org.endpointUri === result.endpointUri &&
            org.countryCode === result.countryCode && 
            org.regionCode === result.regionCode &&
            org.datacenterId === result.datacenterId &&
            org.lat === result.lat &&
            org.long === result.long;
    } catch (err) {
        console.log(err)
    }
    return ret;
}