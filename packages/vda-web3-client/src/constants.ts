/* eslint-disable prettier/prettier */
import { TContractNames } from '@verida/types';
import { NETWORK_DEFINITIONS} from '@verida/vda-common';

/**
 * Create whitelist of Verida contract addresses
 * @dev This is used for Meta Server transactions
 * @returns List of contract addresses
 */
function createContractWhiteList() {
  const contractList = new Array<string>();

  type ContractObject = Record<TContractNames, undefined>;
  const contractProperties: ContractObject = {
    "didLinkage": undefined,
    "didRegistry": undefined,
    "nameRegistry": undefined,
    "reward": undefined,
    "storageNodeRegistry": undefined,
    "token": undefined,
    "solboundNFT": undefined
  };
  const CONTRACT_NAMES = Object.keys(contractProperties) as (TContractNames)[];

  let network: keyof typeof NETWORK_DEFINITIONS;
  for (network in NETWORK_DEFINITIONS ) {
    const networkData = NETWORK_DEFINITIONS[network];

    CONTRACT_NAMES.forEach(contract => {
      if (
        networkData[contract] !== null &&
        !contractList.includes((networkData[contract]!).address.toLowerCase())
      ) {
        contractList.push(networkData[contract]!.address.toLowerCase());
      }
    })
  }
  return contractList;
}

export const veridaContractWhiteList = createContractWhiteList()

export const DEFAULT_JSON_RPC = 'http://127.0.0.1:8545/';
