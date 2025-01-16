'use strict'
const assert = require('assert')

import { DIDDocument } from "../src/index"
import { Wallet } from 'ethers'
import { Keyring } from '@verida/keyring'
import { Network, VeridaDocInterface } from "@verida/types"

import { getResolver } from '@verida/vda-did-resolver';
import { Resolver } from 'did-resolver';
import EncryptionUtils from "@verida/encryption-utils"

const network = Network.MYRTLE

const vdaDidResolver = getResolver()
const didResolver = new Resolver(vdaDidResolver)

// Add a legacy mainnet DID here to test
const mnemonic = ""
const wallet = Wallet.fromMnemonic(mnemonic)

const address = wallet.address.toLowerCase()
const did = `did:vda:mainnet:${address}`

function buildContextConsentMessage(did: string, contextName: string) {
    const lowerCaseDid = did.toLowerCase()
    return `Do you wish to unlock this storage context: "${contextName}"?\n\n${lowerCaseDid}`
}

/**
 * 
 */
describe('DID document tests', () => {

    describe('Document signing and verification', async function() {
        this.timeout(200 * 1000)

        it('can sign and verify context data with an old DID', async function() {
            const CONTEXT_NAME = 'Verida: Vault'
            const consentMessage = buildContextConsentMessage(did, CONTEXT_NAME)

            const keyBuffer = Buffer.from(wallet.privateKey.substr(2), 'hex')
            const consentSignature = await EncryptionUtils.signData(consentMessage, keyBuffer)
            const contextKeyring = new Keyring(consentSignature)

            const signData = {
                hello: 'world'
            }
            const signature = await contextKeyring.sign(signData)

            const response = await didResolver.resolve(did)
            const doc = new DIDDocument(<VeridaDocInterface> response.didDocument)

            // Check invalid signature is correctly identified as invalid
            const invalidSignature = await contextKeyring.sign("invalid data")
            const valid2 = doc.verifyContextSignature(signData, network, CONTEXT_NAME, invalidSignature)
            assert.ok(valid2 === false, "Signature is invalid")

            // Check valid signature is correctly identified as valid
            const valid = doc.verifyContextSignature(signData, network, CONTEXT_NAME, signature)
            assert.ok(valid, "Signature is valid")
        })
    })

})