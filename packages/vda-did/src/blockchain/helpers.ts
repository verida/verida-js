import {ethers} from 'ethers';

export async function getVeridaSignWithNonce(
  rawMsg: string,
  signer: (data: any) => Promise<string>,
  nonce: number
) {
  rawMsg = ethers.utils.solidityPack(['bytes', 'uint256'], [rawMsg, nonce]);
  return signer(rawMsg)
}