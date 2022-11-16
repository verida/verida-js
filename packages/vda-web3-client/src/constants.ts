/* eslint-disable prettier/prettier */
export const veridaContractWhiteList = [
  '0x5c5CA3376b2C82f0322DB9dEE0504D2565080865'.toLowerCase(), //BSCTest - NameRegistry
  '0x1a0A67467DB853486ae328cFdd2d7D51FaefC5E7'.toLowerCase(), //BSCTest - DIDRegistry
  '0x666F81e59082ccD7C8737f84e1C232a982043140'.toLowerCase(), //Mumbai - NameRegistry
  '0x322F0273D7f6eCd9EeBc6C800a6777d1b3EEB697'.toLowerCase(), //Mumbai - DIDRegistry
];

export const DEFAULT_JSON_RPC = 'http://127.0.0.1:8545/'

export const knownNetworks: Record<string, string> = {
  mainnet: '0x89',
  testnet: '0x13881',
};
