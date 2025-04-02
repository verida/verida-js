import {BigNumberish, ethers, Signer} from 'ethers';

export async function getVeridaSignWithNonce(
  rawMsg: string,
  signer: Signer,
  nonce: BigNumberish
) {
  rawMsg = ethers.utils.solidityPack(['bytes', 'uint256'], [rawMsg, nonce]);
  return signer.signMessage(rawMsg)
}
