import {ethers} from 'ethers';
import EncryptionUtils from '@verida/encryption-utils';

export function getVeridaSignWithNonce(
  rawMsg: string,
  privateKey: string,
  nonce: number
) {
  rawMsg = ethers.utils.solidityPack(['bytes', 'uint256'], [rawMsg, nonce]);
  return getVeridaSign(rawMsg, privateKey);
}

export const getVeridaSign = (rawMsg: string, privateKey: string) => {
  const privateKeyArray = new Uint8Array(
    Buffer.from(privateKey.slice(2), 'hex')
  );
  return EncryptionUtils.signData(rawMsg, privateKeyArray);
};
