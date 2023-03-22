'use strict'
const assert = require('assert')
import { box } from "tweetnacl"

import EncryptionUtils from "../src/index"
import { Wallet, utils } from 'ethers'

const signer = Wallet.createRandom()

const signingKey = {
    publicKey: new Uint8Array(Buffer.from(signer.publicKey.substr(2),'hex')),
    privateKey: new Uint8Array(Buffer.from(signer.privateKey.substr(2),'hex'))
}

const sender = {
    publicKey: new Uint8Array([
        250, 121, 196, 219,  20,  87,   6,  49,
        23,  10, 171, 230, 116, 229, 145, 253,
        64, 230,  27, 241,  50, 211,  89, 159,
        31, 110, 122,  60,  26, 119, 249,  25
    ]),
    privateKey: new Uint8Array([
        120, 241, 232,  72,  29,  72, 216, 184,
         73,  15, 211, 142, 107,  55, 217, 183,
        238, 163,  73,   0, 148,  25, 121, 205,
        153,  51, 245,  42, 111, 169, 208,  28
    ])
}

const recipient = {
    publicKey: new Uint8Array([
        140, 136,  68,  36, 185,  64,  46,  58,
        2, 208, 196,   7, 211, 230, 219, 148,
        97, 139,  32, 224, 182, 163,  10, 100,
        11, 131, 158,  10,  49,  67, 167,  33
    ]),
    privateKey: new Uint8Array([
        185, 136,  27,  24, 181, 160, 214,  62,
         16, 177, 159,  30, 193, 150, 146, 129,
        235, 108,  98,  97,  31, 209,   7, 124,
        115, 208, 157, 223,   7, 142,  13, 124
    ])
}

/**
 * 
 */
describe('Encryption tests', () => {

    describe('Sending messages', function() {
        this.timeout(200000)
        
        it('can encrypt a message between users of the same application', async function() {
            const sharedInputKey = box.before(sender.publicKey, sender.privateKey)
            const data = "some random string"
            const encrypted = EncryptionUtils.asymEncrypt(data, sharedInputKey)

            const sharedOutputKey = box.before(sender.publicKey, sender.privateKey)
            const decrypted = EncryptionUtils.asymDecrypt(encrypted, sharedOutputKey)

            assert.equal(data, decrypted, "Input and output match")
        })

        it('can encrypt a message between users of different applications', () => {
            const sharedInputKey = box.before(recipient.publicKey, sender.privateKey)
            const data = "some random string"
            const encrypted = EncryptionUtils.asymEncrypt(data, sharedInputKey)

            const sharedOutputKey = box.before(sender.publicKey, recipient.privateKey)
            const decrypted = EncryptionUtils.asymDecrypt(encrypted, sharedOutputKey)

            assert.equal(data, decrypted, "Input and output match")
        })

        it('can create and verify signatures of a string input', async () => {
            const input = 'hello world'
            // const input = '0x1234'
            const signature = EncryptionUtils.signData(input, signingKey.privateKey)

            const isValid = EncryptionUtils.verifySig(input, signature, signer.address)
            assert.ok(isValid, 'Signature is valid')
        })

        it('can create and verify signatures of a hex string input', async () => {
            const input = '0x1234'
            const signature = EncryptionUtils.signData(input, signingKey.privateKey)

            const isValid = EncryptionUtils.verifySig(input, signature, signer.address)
            assert.ok(isValid, 'Signature is valid')
        })

        it('can create and verify signatures of a JSON input', async () => {
            const input = {
                hello: 'world'
            }

            const signature = EncryptionUtils.signData(input, signingKey.privateKey)
            const isValid = EncryptionUtils.verifySig(input, signature, signer.address)
            assert.ok(isValid, 'Signature is valid')
        })

        it('can create and verify signatures of byte array', async () => {
            const input = [0x1, 0x2, 0x3]

            const signature = EncryptionUtils.signData(input, signingKey.privateKey)
            const isValid = EncryptionUtils.verifySig(input, signature, signer.address)
            assert.ok(isValid, 'Signature is valid')
        })

        it('can create and verify signatures of Buffer', async () => {
            const input = Buffer.from([1, 2, 3])

            const signature = EncryptionUtils.signData(input, signingKey.privateKey)
            const isValid = EncryptionUtils.verifySig(input, signature, signer.address)
            assert.ok(isValid, 'Signature is valid')
        })

        it('can create and verify signatures of JSON in different order', async () => {
            const input1 = {
                hello: 'world',
                goodbye: 'world',
                level2: {
                    test: 'world',
                    fail: 'value'
                }
            }

            const input2 = {
                goodbye: 'world',
                level2: {
                    fail: 'value',
                    test: 'world'
                },
                hello: 'world'
            }

            const signature = EncryptionUtils.signData(input1, signingKey.privateKey)
            const isValid = EncryptionUtils.verifySig(input2, signature, signer.address)
            assert.ok(isValid, 'Signature is valid')
        })
    })

})