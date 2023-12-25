import {BigNumberish, ethers} from 'ethers';

export async function getVeridaSignWithNonce(
  rawMsg: string,
  signer: (data: any) => Promise<string>,
  nonce: BigNumberish
) {
  rawMsg = ethers.utils.solidityPack(['bytes', 'uint256'], [rawMsg, nonce]);
  return signer(rawMsg)
}