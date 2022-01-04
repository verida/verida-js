const assert = require('assert');
import { StorageLink } from '../src/index';
import { DIDClient } from '@verida/did-client';

const MNEMONIC = 'slight crop cactus cute trend tape undo exile retreat large clay average';
const DID_SERVER_URL = 'http://localhost:5001';
const CONTEXT = 'Verida: Vault';
const didClient = new DIDClient(DID_SERVER_URL);
didClient.authenticate(MNEMONIC);
const DID = didClient.getDid();

describe('Test storage links for a DID', () => {
  describe('Get links for an existing DID', function () {
    this.timeout(20000);

    it('can fetch all storage links', async function () {
      const storageLinks = await StorageLink.getLinks(didClient, DID);

      assert.ok(storageLinks, 'Got storage links');
    });

    it('can fetch vault storage link', async function () {
      const storageLink = await StorageLink.getLink(didClient, DID, CONTEXT);

      assert.ok(storageLink, 'Got storage link for the vault');
    });
  });
});
