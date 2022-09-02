/* eslint-disable prettier/prettier */
export const veridaContractWhiteList = [
  '0x5c5CA3376b2C82f0322DB9dEE0504D2565080865'.toLowerCase(), //NameRegistry
  '0x120cB7A5a2663c8B77f823e3552C164AeAe2596c'.toLowerCase() //DID - Testnet with veridaSignature
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
