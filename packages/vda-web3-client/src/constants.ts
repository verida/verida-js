/* eslint-disable prettier/prettier */
export const veridaContractWhiteList = [
  // ''.toLowerCase(), //BSCTest - NameRegistry
  // ''.toLowerCase(), //BSCTest - DIDRegistry
  '0x666F81e59082ccD7C8737f84e1C232a982043140'.toLowerCase(), //Mumbai - NameRegistry
  '0x6905AD01eA5Bfb2fa651F9a2DF9659A7Cad8752a'.toLowerCase(), //Mumbai - DIDRegistry
];

export const DEFAULT_JSON_RPC = 'http://127.0.0.1:8545/'

export const knownNetworks: Record<string, string> = {
  mainnet: '0x89',
  testnet: '0x13881',
};
