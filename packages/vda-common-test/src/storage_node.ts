import { DID_LIST } from "./const";

// Data centers added to the contract
export const REGISTERED_DATACENTERS = [
  {
    name: "center-1",
    countryCode: "us", 
    regionCode: "north america",
    lat: 54.526, 
    long: 105.255
  },
  {
    name: "center-2",
    countryCode: "uk", 
    regionCode: "europe",
    lat: 55.378, 
    long: 3.436
  },
  {
    name: "center-4",
    countryCode: "us", 
    regionCode: "north america",
    lat: 55.126, 
    long: 90.255
  },
];

// DIDs that are registered in the contract
export const REGISTERED_DIDS  = [
  DID_LIST[0],
  DID_LIST[1]
];
// Map of DID address and its storage node
export const DID_NODE_MAP : Map<string, any> = new Map([
  [REGISTERED_DIDS[0].address, {
          endpointUri: 'https://1',
          countryCode: 'us',
          regionCode: 'north america',
          datacenterId: 1,
          lat: -90,
          long: -180,
          slotCount: 20000
  }],
  [REGISTERED_DIDS[1].address, {
      endpointUri: 'https://2',
      countryCode: 'us',
      regionCode: 'europe',
      datacenterId: 2,
      lat: -88.5,
      long: 10.436,
      slotCount: 20000
  }]
]);