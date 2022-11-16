import {ethers, Wallet} from 'ethers';

import {getVeridaWeb3Instance, getVeridaSignWithNonce} from './utils';
import {expect} from 'chai';

const didRegistry = getVeridaWeb3Instance('DidRegistry');

// Test Datas
const did = Wallet.createRandom();
const badSigner = Wallet.createRandom();

const endPoints_A = ['https://A_1', 'https://A_2', 'https://A_3'];
const endPoints_B = ['https://B_1', 'https://B_2'];
const endPoints_Empty: string[] = [];

// Helper functions to create signature
const nonceFN = async (did: string) => {
  const response = await didRegistry.nonce(did);
  if (response.data === undefined) {
    throw new Error('Error in getting nonce');
  }
  return response.data;
};

// Getting singature functions
const getRegisterSignature = async (
  did: string,
  endpoints: string[],
  signKey: string
) => {
  let rawMsg = ethers.utils.solidityPack(['address', 'string'], [did, '/']);

  for (let i = 0; i < endpoints.length; i++) {
    rawMsg = ethers.utils.solidityPack(
      ['bytes', 'string', 'string'],
      [rawMsg, endpoints[i], '/']
    );
  }
  return await getVeridaSignWithNonce(rawMsg, signKey, await nonceFN(did));
};

const getControllerSignature = async (
  did: string,
  controller: string,
  signKey: string
) => {
  const rawMsg = ethers.utils.solidityPack(
    ['address', 'string', 'address', 'string'],
    [did, '/setController/', controller, '/']
  );
  return await getVeridaSignWithNonce(rawMsg, signKey, await nonceFN(did));
};

const getRevokeSignature = async (did: string, signKey: string) => {
  const rawMsg = ethers.utils.solidityPack(
    ['address', 'string'],
    [did, '/revoke/']
  );
  return await getVeridaSignWithNonce(rawMsg, signKey, await nonceFN(did));
};

// Contract interaction functions
const checkRegister = async (
  did: string,
  endpoints: string[],
  signKey: string,
  expectResult: boolean,
  msg: string | undefined = undefined
) => {
  const signature = await getRegisterSignature(did, endpoints, signKey);
  const response = await didRegistry.register(did, endpoints, signature);
  expect(response.success).to.be.equal(expectResult, msg);
};

const checkRevoke = async (
  did: string,
  signKey: string,
  expectResult: boolean,
  msg: string | undefined = undefined
) => {
  const signature = await getRevokeSignature(did, signKey);
  const response = await didRegistry.revoke(did, signature);
  expect(response.success).to.be.equal(expectResult, msg);
};

const checkLookup = async (
  did: string,
  expectedResult: boolean,
  resultMsg: string | undefined = undefined,
  expectedData: string[] | undefined = undefined,
  dataMsg: string | undefined = undefined
) => {
  const response = await didRegistry.lookup(did);
  expect(response.success).to.be.equal(expectedResult, resultMsg);
  if (expectedResult === true && expectedData !== undefined) {
    expect(response.data).deep.equal(expectedData, dataMsg);
  }
};

const checkGetController = async (
  did: string,
  expectedOwner: string,
  msg: undefined | string = undefined
) => {
  const response = await didRegistry.getController(did);
  expect(response.success).to.be.equal(true, 'Should always get controller');
  expect(response.data).to.equal(expectedOwner, msg);
};

const checkSetController = async (
  did: string,
  controller: string,
  signKey: string,
  expectedResult: boolean,
  msg: string | undefined = undefined
) => {
  const signature = await getControllerSignature(did, controller, signKey);
  const response = await didRegistry.setController(did, controller, signature);
  expect(response.success).to.be.equal(expectedResult, msg);
};
describe('DidRegistry Test', () => {
  describe('Register', () => {
    it('Should reject for invalid signature', async () => {
      await checkRegister(
        did.address,
        endPoints_A,
        badSigner.privateKey,
        false,
        'Rejected for invalid signature'
      );
    });

    it('Success', async () => {
      await checkRegister(
        did.address,
        endPoints_A,
        did.privateKey,
        true,
        'Registered successfully'
      );
    });

    it('Should update for already registered DID address', async () => {
      // Check registered data
      // await checkLookup(did.address, true, '', endPoints_A);

      // Update for registered DID
      await checkRegister(
        did.address,
        endPoints_B,
        did.privateKey,
        true,
        'Updated successfully'
      );
    });

    it('Should reject for revoked DID address', async () => {
      const tempDID = Wallet.createRandom();

      // Register
      await checkRegister(
        tempDID.address,
        endPoints_A,
        tempDID.privateKey,
        true
      );

      // Revoke
      await checkRevoke(tempDID.address, tempDID.privateKey, true);

      // Should register failed
      await checkRegister(
        tempDID.address,
        endPoints_B,
        tempDID.privateKey,
        false,
        'Should reject for revoked DID address'
      );
    });
  });

  describe('Lookup', () => {
    it('Get endpoints registered', async () => {
      await checkRegister(did.address, endPoints_B, did.privateKey, true);
      await checkLookup(did.address, true, '', endPoints_B);
    });

    it('Should reject for unregistered DIDs', async () => {
      const testDID = Wallet.createRandom();
      await checkLookup(
        testDID.address,
        false,
        'Rejected for unregistered DID address'
      );
    });

    it('Should return empty array for empty endpoints', async () => {
      const testDID = Wallet.createRandom();

      await checkRegister(
        testDID.address,
        endPoints_Empty,
        testDID.privateKey,
        true
      );

      await checkLookup(
        testDID.address,
        true,
        '',
        endPoints_Empty,
        'Get empty endpoings'
      );
    });

    it('Should reject for revoked DID', async () => {
      const testDID = Wallet.createRandom();

      // Register
      await checkRegister(
        testDID.address,
        endPoints_A,
        testDID.privateKey,
        true
      );

      // Revoke
      await checkRevoke(testDID.address, testDID.privateKey, true);

      // Should reject for revoked DID address
      await checkLookup(testDID.address, false, 'Rejected for revoked DID');
    });
  });

  describe('Set controller', () => {
    it('Should reject for unregistered address', async () => {
      const testDID = Wallet.createRandom();
      const controller = Wallet.createRandom();
      await checkSetController(
        testDID.address,
        controller.address,
        testDID.privateKey,
        false,
        'Rejected for unregistered address'
      );
    });

    it('Should reject for invalid signature', async () => {
      const controller = Wallet.createRandom();
      await checkSetController(
        did.address,
        controller.address,
        badSigner.privateKey,
        false,
        'Rejected for invalid signature'
      );
    });

    it('Change controller for registered one', async () => {
      // Check original controller
      await checkGetController(did.address, did.address);

      const controller = Wallet.createRandom();
      await checkSetController(
        did.address,
        controller.address,
        did.privateKey,
        true,
        'Successfully changed the controller'
      );

      // Check updated controller
      await checkGetController(
        did.address,
        controller.address,
        'Get updated controller'
      );

      // Restore controller for later tests
      await checkSetController(
        did.address,
        did.address,
        controller.privateKey,
        true,
        'Restore controller to original'
      );
    });
  });

  describe('Get controller', () => {
    it('Should return did itself for unchanged DID', async () => {
      await checkGetController(
        did.address,
        did.address,
        'Controller is DID itself'
      );
    });

    it('Should return did itself for unregistered DID', async () => {
      const testDID = Wallet.createRandom();
      await checkGetController(
        testDID.address,
        testDID.address,
        'Controller is DID itself'
      );
    });

    it('Should return updated one for controller changed DID', async () => {
      // Check original controller
      await checkGetController(
        did.address,
        did.address,
        'Get original controller'
      );

      // Update controller
      const controller = Wallet.createRandom();
      await checkSetController(
        did.address,
        controller.address,
        did.privateKey,
        true,
        'Controller changed'
      );

      // Check updated controller
      await checkGetController(
        did.address,
        controller.address,
        'Get updated controller'
      );

      // Restore controller to original for later tests
      await checkSetController(
        did.address,
        did.address,
        controller.privateKey,
        true
      );
    });
  });

  describe('Revoke', () => {
    const controller = Wallet.createRandom();

    before(async () => {
      // Register did & update controller for revoke test
      await checkRegister(did.address, endPoints_A, did.privateKey, true);
      await checkSetController(
        did.address,
        controller.address,
        did.privateKey,
        true
      );

      await checkGetController(did.address, controller.address);
    });

    it('Should reject for unregistered DID', async () => {
      const testDID = Wallet.createRandom();
      await checkRevoke(
        testDID.address,
        testDID.privateKey,
        false,
        'Rejected for unregistered DID'
      );
    });

    it('Should reject for invalid signature - bad signer', async () => {
      await checkRevoke(
        did.address,
        badSigner.privateKey,
        false,
        'Invalid signature'
      );
    });

    it('Should reject for invalid signature - not a controller', async () => {
      await checkRevoke(
        did.address,
        did.privateKey,
        false,
        'Invalid signature'
      );
    });

    it('Revoked successfully', async () => {
      await checkRevoke(
        did.address,
        controller.privateKey,
        true,
        'Revoked successfully'
      );
    });

    it('Should reject for revoked DID', async () => {
      await checkRevoke(
        did.address,
        controller.privateKey,
        false,
        'Rejected for revoked DID'
      );
    });
  });
});
