import { DID_LIST } from "./const";

/**
 * Data centres to be added for test
 */
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

/**
 * Data centres to be removed for test
 */
export const REMOVED_DATACENTRES = [
  {
    name: "centre-removed",
    countryCode: "fr", 
    regionCode: "europe",
    lat: 55.126, 
    long: 90.255
  },
]

/**
 * DIDs to be registered for test
 */
export const REGISTERED_DIDS  = [
  DID_LIST[0],
  DID_LIST[1],
  DID_LIST[2], // Fallback did
  DID_LIST[3], // Remove start did
  DID_LIST[4], // Remove complete did

  DID_LIST[5], // For locking test
];

/**
 * Fall back node DIDs for removing node operation
 */
export const FALLBACK_DIDS = [
  DID_LIST[2],
]

/**
 * DID that is in the remove started state for test
 */
export const REMOVE_START_DIDS = [
  DID_LIST[3], // Remove node started did
]

/**
 * DID for remove completed operation test
 * Not able to complete this operation because of delay between `remove start` and `remove complete` operations
 * Only reserved
 */
export const REMOVE_COMPLETE_DIDS = [
  DID_LIST[4], // Remove node completed did
]

/**
 * Map of DID and it's storage node
 */
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
  }],
  [REGISTERED_DIDS[5].address, {
    name: "node-lock-test",
    endpointUri: 'https://lock-1',
    countryCode: 'us',
    regionCode: 'north america',
    datacentreId: 1,
    lat: -89,
    long: -178.5,
    slotCount: 20000,
    acceptFallbackSlots: false
  }]
]);

/**
 * Registered DID for locking test
 */
export  const REGISTERED_LOCK_NODE = DID_LIST[5];

/**
 * Locked information list
 */
export const LOCK_LIST = [
  {
    purpose: "Purpose-1",
    amount: 100,
  },
  {
    purpose: "Purpose-2",
    amount: 200,
  },
];