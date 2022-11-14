import {ethers, Wallet} from 'ethers';

import {getVeridaWeb3Instance, getVeridaSignWithNonce, dids} from './utils';
import {expect} from 'chai';

const nameRegistry = getVeridaWeb3Instance('NameRegistry');

// Test Datas
const testNames = [
  'helloworld.verida',
  'hello----world--.verida',
  'hello_world-dave.verida',
  'JerrySmith.verida',

  'JerrySmith.test',
  'Billy.test',
];
const newSuffix = 'test';
const zeroAddress = '0x0000000000000000000000000000000000000000';

// Helper functions to create signature
const nonceFN = async (did: string) => {
  const response = await nameRegistry.nonce(did);
  if (response.data === undefined) {
    throw new Error('Error in getting nonce');
  }
  return response.data;
};

// Getting singature functions
const getRegisterSignature = async (
  did: string,
  name: string,
  signKey: string
) => {
  const rawMsg = ethers.utils.solidityPack(['string', 'address'], [name, did]);
  return getVeridaSignWithNonce(rawMsg, signKey, await nonceFN(did));
};

// Contract interaction functions
describe('NameRegistry Test', () => {
});
