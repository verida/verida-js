/* eslint-disable prettier/prettier */
export const veridaContractWhiteList = [
  // ''.toLowerCase(), //BSCTest - NameRegistry
  // ''.toLowerCase(), //BSCTest - DIDRegistry
  '0x666F81e59082ccD7C8737f84e1C232a982043140'.toLowerCase(), //Mumbai - NameRegistry
  '0x7347E3C6b8Fc38B2fb4a4f72E68953F0A4b899b0'.toLowerCase(), //Mumbai - DIDRegistry
];

export const DEFAULT_JSON_RPC = 'http://127.0.0.1:8545/'

export const knownNetworks: Record<string, string> = {
  mainnet: '0x89',
  testnet: '0x13881',
};
