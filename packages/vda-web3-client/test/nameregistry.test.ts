import {ethers, Wallet} from 'ethers';

import {getVeridaWeb3Instance, getVeridaSignWithNonce, dids} from './utils';
import {expect} from 'chai';

const nameRegistry = getVeridaWeb3Instance('NameRegistry');

// Test Datas
const badSigner = Wallet.createRandom(); // dids[1];

const testNames = [
  'helloworld.vda',
  'hello----world--.vda',
  'hello_world-dave.vda',
  'JerrySmith.vda',

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
  name: string,
  did: string,
  signKey: string
) => {
  const rawMsg = ethers.utils.solidityPack(['string', 'address'], [name, did]);
  return getVeridaSignWithNonce(rawMsg, signKey, await nonceFN(did));
};

// Contract interaction functions
const checkRegister = async (
  name: string,
  did: string,
  signKey: string,
  expectedResult: boolean,
  msg: string | undefined = undefined
) => {
  const signature = await getRegisterSignature(name, did, signKey);
  const response = await nameRegistry.register(name, did, signature);
  expect(response.success).to.be.equal(expectedResult, msg);
};

const checkUnregister = async (
  name: string,
  did: string,
  signKey: string,
  expectedResult: boolean,
  msg: string | undefined = undefined
) => {
  const signature = await getRegisterSignature(name, did, signKey);
  const response = await nameRegistry.unregister(name, did, signature);
  expect(response.success).to.be.equal(expectedResult, msg);
};

const checkFindDID = async (
  name: string,
  expectedResult: boolean,
  resultMsg: string | undefined = undefined,
  expectedData: string | undefined = undefined,
  dataMsg: string | undefined = undefined
) => {
  const response = await nameRegistry.findDID(name);
  expect(response.success).to.be.equal(expectedResult, resultMsg);
  if (expectedResult === true && expectedData !== undefined) {
    expect(response.data).equal(expectedData, dataMsg);
  }
};

const checkGetUserNameList = async (
  did: string,
  expectedResult: boolean,
  resultMsg: string | undefined = undefined,
  expectedData: string[] | undefined = undefined,
  dataMsg: string | undefined = undefined
) => {
  const response = await nameRegistry.getUserNameList(did);
  expect(response.success).to.be.equal(expectedResult, resultMsg);
  if (expectedResult === true && expectedData !== undefined) {
    expect(response.data).deep.equal(expectedData, dataMsg);
  }
};

describe('NameRegistry Test', () => {
  describe('Register', () => {
    it('Failed : Invalid zero address', async () => {
      await checkRegister(
        testNames[0],
        zeroAddress,
        badSigner.privateKey,
        false,
        'Failed for zero address'
      );
    });

    it('Failed : Invalid character specified in names', async () => {
      const invalidnames = ['hello world.vda', 'hello!world.vda'];
      for (let i = 0; i < invalidnames.length; i++) {
        await checkRegister(
          invalidnames[i],
          dids[0].address,
          dids[0].privateKey,
          false,
          'Failed for invalid names'
        );
      }
    });

    it('Failed : "." not allowed in name', async () => {
      const invalidnames = ['david.test.vda', 'hello..vda'];
      for (let i = 0; i < invalidnames.length; i++) {
        await checkRegister(
          invalidnames[i],
          dids[0].address,
          dids[0].privateKey,
          false,
          'Invalid character specified in name'
        );
      }
    });

    it('Failed : Unregistered suffix', async () => {
      await checkRegister(
        testNames[4],
        dids[0].address,
        dids[0].privateKey,
        false,
        'Invalid suffix'
      );
    });

    it('Failed : Invalid signature', async () => {
      await checkRegister(
        testNames[0],
        dids[0].address,
        badSigner.privateKey,
        false,
        'Invalid signature'
      );
    });

    describe('Name Length Test', () => {
      const did = dids[5];

      it('Failed on length 1 & 33', async () => {
        const invalidnames = [
          'a.vda', // length 1
          'abcdefghijklmnopqrstuvwxyz0123456.vda', // length 33
        ];
        for (let i = 0; i < invalidnames.length; i++) {
          await checkRegister(
            invalidnames[i],
            did.address,
            did.privateKey,
            false,
            'Failed for invalid name length'
          );
        }
      });

      it('Success on length 2 & 32', async () => {
        const names = [
          'ab.vda', // length 2
          'abcdefghijklmnopqrstuvwxyz012345.vda', // length 32
        ];
        for (let i = 0; i < names.length; i++) {
          // register
          await checkRegister(names[i], did.address, did.privateKey, true);
          await checkFindDID(names[i], true, '', did.address);

          // Must unregister for later tests. There is `maxNamesPerDID` limit
          await checkUnregister(names[i], did.address, did.privateKey, true);
        }
      });
    });

    it('Register successfully', async () => {
      const did = dids[0];
      for (let i = 0; i < 3; i++) {
        await checkRegister(
          testNames[i],
          did.address,
          did.privateKey,
          true,
          'Registered successfully'
        );
      }
    });

    it('Failed : Name already registered', async () => {
      await checkRegister(
        testNames[0],
        dids[0].address,
        dids[0].privateKey,
        false,
        'Name already registered'
      );
    });
  });

  describe('Get username list', () => {
    it('Failed : Unregistered DID', async () => {
      await checkGetUserNameList(dids[1].address, false, 'No registered DID');
    });

    it('Get username list successfully', async () => {
      await checkGetUserNameList(
        dids[0].address,
        true,
        'Get username list successfully',
        [testNames[0], testNames[1], testNames[2]]
      );
    });
  });

  describe('Unregister', () => {
    it('Failed : Unregistered name', async () => {
      await checkUnregister(
        testNames[3],
        dids[0].address,
        dids[0].privateKey,
        false,
        'Unregistered name'
      );
    });

    it('Failed : Invalid DID', async () => {
      await checkUnregister(
        testNames[0],
        dids[1].address,
        dids[1].privateKey,
        false,
        'Invalid DID'
      );

      await checkUnregister(
        testNames[1],
        dids[2].address,
        dids[2].privateKey,
        false,
        'Invalid DID'
      );
    });

    it('Unregister successfully', async () => {
      await checkGetUserNameList(dids[0].address, true);

      for (let i = 0; i < 3; i++) {
        await checkUnregister(
          testNames[i],
          dids[0].address,
          dids[0].privateKey,
          true,
          'Unregistered successfully'
        );
      }

      await checkGetUserNameList(dids[0].address, false, 'No registered DID');
    });
  });
});
