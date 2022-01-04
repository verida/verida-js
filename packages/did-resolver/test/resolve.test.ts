'use strict';
const assert = require('assert');

import { Resolver } from 'did-resolver';
import vda from '../src';

const DID_REGISTRY_ENDPOINT = 'http://localhost:5001';
const TEST_DID = `did:vda:0xb194a2809b5b3b8aae350d85233439d32b361694`;

/**
 *
 */
describe('DID resolver tests', () => {
  describe('Resolve tests', function () {
    it('can resolve a valid DID', async function () {
      const vdaResolver = vda.getResolver(DID_REGISTRY_ENDPOINT);

      const resolver = new Resolver(vdaResolver);
      const doc = await resolver.resolve(TEST_DID);

      assert.ok(doc, 'DID document resolved');
      assert.equal(doc.id, TEST_DID, 'DID document has correct ID');
    });
  });
});
