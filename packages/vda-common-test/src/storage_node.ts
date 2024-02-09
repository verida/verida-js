import { DID_LIST } from "./const";

// Data centres added to the contract
export const REGISTERED_DATACENTRES = [
  {
    name: "centre-1",
    countryCode: "us", 
    regionCode: "north america",
    lat: 54.526, 
    long: 105.255
  },
  {
    name: "centre-2",
    countryCode: "uk", 
    regionCode: "europe",
    lat: 55.378, 
    long: 3.436
  },
  {
    name: "centre-3",
    countryCode: "us", 
    regionCode: "north america",
    lat: 55.126, 
    long: 90.255
  },
  {
    name: "centre-4",
    countryCode: "uk", 
    regionCode: "europe",
    lat: 56.822, 
    long: 4.163
  },
];

export const REMOVED_DATACENTRES = [
  {
    name: "centre-removed",
    countryCode: "fr", 
    regionCode: "europe",
    lat: 55.126, 
    long: 90.255
  },
]

// DIDs that are registered in the contract
export const REGISTERED_DIDS  = [
  DID_LIST[0],
  DID_LIST[1],
  DID_LIST[2], // Fallback did
  DID_LIST[3], // Remove start did
  DID_LIST[4], // Remove complete did
];

export const FALLBACK_DIDS = [
  DID_LIST[2],
]

export const REMOVE_START_DIDS = [
  DID_LIST[3], // Remove node started did
]

// Not able to test till the removed time reached
export const REMOVE_COMPLETE_DIDS = [
  DID_LIST[4], // Remove node completed did
]
// Map of DID address and its storage node
export const DID_NODE_MAP : Map<string, any> = new Map([
  [REGISTERED_DIDS[0].address, {
    name: "node-1",
    endpointUri: 'https://1',
    countryCode: 'us',
    regionCode: 'north america',
    datacentreId: 1,
    lat: -90,
    long: -180,
    slotCount: 20000,
    acceptFallbackSlots: true
  }],
  [REGISTERED_DIDS[1].address, {
    name: "node-2",
    endpointUri: 'https://2',
    countryCode: 'us',
    regionCode: 'europe',
    datacentreId: 2,
    lat: -88.5,
    long: 10.436,
    slotCount: 20000,
    acceptFallbackSlots: false
  }],
  [REGISTERED_DIDS[2].address, {
    name: "node-fallback",
    endpointUri: 'https://fallback-node-1',
    countryCode: 'us',
    regionCode: 'north america',
    datacentreId: 2,
    lat: -88.5,
    long: 10.436,
    slotCount: 20000,
    acceptFallbackSlots: true
  }],
  [REGISTERED_DIDS[3].address, {
    name: "node-remove-started",
    endpointUri: 'https://remove-started-node',
    countryCode: 'us',
    regionCode: 'north america',
    datacentreId: 1,
    lat: -88.5,
    long: 10.436,
    slotCount: 20000,
    acceptFallbackSlots: true
  }],
  [REGISTERED_DIDS[4].address, {
    name: "node-remove-completed",
    endpointUri: 'https://remove-completed-node',
    countryCode: 'us',
    regionCode: 'north america',
    datacentreId: 3,
    lat: -88.5,
    long: 10.436,
    slotCount: 20000,
    acceptFallbackSlots: true
  }]
]);