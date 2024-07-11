import { BigNumberish, utils } from 'ethers'
import EncryptionUtils from '@verida/encryption-utils'
import { BlockchainAnchor } from '@verida/types';

const { computeAddress, getAddress, solidityPack } = utils

export function interpretIdentifier(identifier: string): {
  address: string;
  publicKey?: string;
  network?: BlockchainAnchor;
} {
  let id = identifier;
  let networkString: string | undefined = undefined;

  if (id.startsWith("did:vda")) {
    id = id.split("?")[0];
    const components = id.split(":");
    id = components[components.length - 1];
    if (components.length >= 4) {
      networkString = components.splice(2, components.length - 3).join(":");
    }
  }

  if (!networkString) {
    throw new Error('Unable to locate network')
  }

  const network = mapDidNetworkToBlockchainAnchor(networkString)
  
  if (id.length > 42) {
    return { address: computeAddress(id), publicKey: id, network };
  } else {
    return { address: getAddress(id), network }; // checksum address
  }
}

/**
 * Map the network part of the DID to the BlockchanAnchor.
 * @dev Get the `BlockchainAnchor` type from the `BlockchainAnchor` string or chain strings created in the previous version.
 * This function is back-ward compatiblity.
 * There are DIDs such as `did:vda:mainnet:0x....` and `did:vda:testnet:0x...` that were created in the previous version
 * @param networkString 
 * @returns 
 */
export function mapDidNetworkToBlockchainAnchor(networkString: string): BlockchainAnchor | undefined {
  let network: BlockchainAnchor | undefined

  // Convert `network` to EnvironmentType
  if (networkString?.toLowerCase() == 'mainnet') {
    network = BlockchainAnchor.POLPOS;
  } else if (networkString?.toLowerCase() == 'testnet') {
    network = BlockchainAnchor.POLAMOY;
  } else {
    network = Object.values(BlockchainAnchor)
      .find((value) => value.toLowerCase() === networkString!.toLowerCase());
  }

  return network
}

export function getVeridaSignWithNonce(
  rawMsg: string,
  privateKey: string,
  nonce: BigNumberish
) {
  rawMsg = solidityPack(['bytes', 'uint256'], [rawMsg, nonce]);
  return getVeridaSign(rawMsg, privateKey);
}
  
export const getVeridaSign = (rawMsg: string, privateKey: string) => {
  const privateKeyArray = new Uint8Array(
    Buffer.from(privateKey.slice(2), 'hex')
  );
  return EncryptionUtils.signData(rawMsg, privateKeyArray);
};