/* eslint-disable prettier/prettier */
import {CONTRACT_ADDRESS, CONTRACT_NAMES} from '@verida/vda-common';

function createContractWhiteList() {
  const contractList = new Array<string>();
  let contractName: CONTRACT_NAMES;
  for (contractName in CONTRACT_ADDRESS) {
    const contract = CONTRACT_ADDRESS[contractName];
    for (const net in contract) {
      const contractAddress = contract[net];
      if (
        contractAddress !== null &&
        !contractList.includes(contractAddress.toLowerCase())
      ) {
        contractList.push(contractAddress.toLowerCase());
      }
    }
  }
  return contractList;
}

export const veridaContractWhiteList = createContractWhiteList()

export const DEFAULT_JSON_RPC = 'http://127.0.0.1:8545/'

export const knownNetworks: Record<string, string> = {
  mainnet: '0x89',
  testnet: '0x13881',
};
