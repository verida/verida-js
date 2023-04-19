import { computeAddress, getAddress, solidityPacked } from 'ethers'
import EncryptionUtils from '@verida/encryption-utils'

export function interpretIdentifier(identifier: string): {
  address: string;
  publicKey?: string;
  network?: string;
} {
  let id = identifier;
  let network = undefined;
  if (id.startsWith("did:vda")) {
    id = id.split("?")[0];
    const components = id.split(":");
    id = components[components.length - 1];
    if (components.length >= 4) {
      network = components.splice(2, components.length - 3).join(":");
    }
  }
  
  if (id.length > 42) {
    return { address: computeAddress(id), publicKey: id, network };
  } else {
    return { address: getAddress(id), network }; // checksum address
  }
}

export function getVeridaSignWithNonce(
  rawMsg: string,
  privateKey: string,
  nonce: number
) {
  rawMsg = solidityPacked(['bytes', 'uint256'], [rawMsg, nonce]);
  return getVeridaSign(rawMsg, privateKey);
}
  
export const getVeridaSign = (rawMsg: string, privateKey: string) => {
  const privateKeyArray = new Uint8Array(
    Buffer.from(privateKey.slice(2), 'hex')
  );
  return EncryptionUtils.signData(rawMsg, privateKeyArray);
};