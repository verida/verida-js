/* eslint-disable prettier/prettier */
export const veridaContractWhiteList = [
  '0x2862BC860f55D389bFBd1A37477651bc1642A20B', //DID
  '0x5c5CA3376b2C82f0322DB9dEE0504D2565080865', //NameRegistry
  '0x17dFd83eFDD2D0c430E2cA4b01d1df93cDa9960b', //DID
];

export const DEFAULT_JSON_RPC = 'http://127.0.0.1:8545/'

export const knownInfuraNetworks: Record<string, string> = {
  mainnet: '0x1',
  ropsten: '0x3',
  rinkeby: '0x4',
  goerli: '0x5',
  kovan: '0x2a',
};

export const knownNetworks: Record<string, string> = {
  // ...knownInfuraNetworks,
  bsc: '0x38',
  bsctestnet: '0x61',
  matic: '0x89',
  maticmum: '0x13881',
};
