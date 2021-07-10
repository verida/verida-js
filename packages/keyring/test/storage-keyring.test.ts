// @todo: Migrate from datastore keyring test

var assert = require("assert");
import { box } from "tweetnacl";

import Keyring from "../src/keyring";

describe("Keyring", function() {
    var keyring

    this.beforeAll(function() {
        const seedUint8 = new Uint8Array([37, 111, 93, 122, 134, 74, 12, 201, 10, 204, 68, 90, 213, 69, 150, 82, 163, 69, 157, 239, 64, 194, 140, 31, 144, 79, 225, 141, 74, 52, 70, 90])
        const seed = '0x' + Buffer.from(seedUint8).toString('hex')
        keyring = new Keyring(seed)
    });

    describe("Signing", function() {
        it("should generate a verified signature", async function() {
            let data = {
                "Margaret": "Hamilton"
            };

            const sig = await keyring.sign(data)

            const verified = await keyring.verifySig(data, sig)
            
            assert(verified,true);
        });
    });

    describe("Symmetric encryption", function() {
        it("should symmetrically encrypt and decrypt", async function() {
            const data = {
                "Stephanie": "Shirley"
            };

            const encryptedMessage = await keyring.symEncrypt(data);
            const decryptedMessage = await keyring.symDecrypt(encryptedMessage);

            assert.deepEqual(data, decryptedMessage);
        });
    });

    describe("Asymmetric encryption", function() {
        it("should assymetrically encrypt and decrypt a message with shared key", async function() {
            const data = {
                "Joan": "Clarke"
            };
    
            // create a test key pair for a third party
            const otherKeyPair = box.keyPair();
            
            // encrypt the data
            const sharedKeyStart = await keyring.buildSharedKeyStart(otherKeyPair.secretKey);
            const encrypted = await keyring.asymEncrypt(data, sharedKeyStart);

            // decrypt the data
            const sharedKeyEnd = await keyring.buildSharedKeyEnd(otherKeyPair.publicKey);
            const decrypted = await keyring.asymDecrypt(encrypted, sharedKeyEnd);
    
            assert.deepEqual(data, decrypted);
        });
    });
});