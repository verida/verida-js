'use strict'
const assert = require('assert')

import { JsonRpcProvider } from '@ethersproject/providers'
import { Wallet } from '@ethersproject/wallet'
import { VdaDID } from '@verida/vda-did'

import { DIDClient, createDIDClient } from "../src/index"

require('dotenv').config()

if (process.env.PRIVATE_KEY === undefined) {
    throw new Error('PRIVATE_KEY not defined in env')
}
const privateKey : string = process.env.PRIVATE_KEY!
const veridaPrivateKey = '0x' + privateKey

const currentNet = process.env.RPC_TARGET_NET
if (currentNet === undefined) {
    throw new Error('RPC_TARGET_NET is not defined in env')
}

const chainId = process.env[`CHAIN_ID_${currentNet}`]
if (chainId === undefined) {
  throw new Error('Chain ID not defined in env')
}
console.log('Chain Id : ', chainId)

const rpcUrl = process.env[`${currentNet}`]
if (rpcUrl === undefined) {
    throw new Error('RPC url is not defined in env')
}
console.log('Curren:', rpcUrl)

const registry = process.env[`CONTRACT_ADDRESS_${currentNet}_DidRegistry`]
if (registry === undefined) {
    throw new Error("Registry address not defined in env")
}
console.log('Contract : ', registry)

const identity = new Wallet(veridaPrivateKey).address

const provider = new JsonRpcProvider(rpcUrl);
const txSigner = new Wallet(privateKey, provider)


describe('DID Document tests', () => {
    let didClient

    const contextList = [
        Wallet.createRandom().address,
        Wallet.createRandom().address,
        Wallet.createRandom().address
    ]

    const pubKeyList = [
        Wallet.createRandom().address,
        Wallet.createRandom().address,
        Wallet.createRandom().address
    ]

    before(async () => {
        console.log('Creating DIDClient for test')
        didClient = await createDIDClient({
            veridaPrivateKey,
        
            // vda-did resolver - only
            identifier : identity, // DID
            // chainName? : string, 
            chainId : chainId,
        
            // common to vda-did resolver & vda-did self transaction config
            provider,
            rpcUrl,
            registry,
            // web3?: any,
        
            // vda-did
            callType: 'web3',
        
            // self or meta transaction configuration
            web3Config: {
                signer: txSigner
            }
        })
        console.log('DIDClient created successfully')
    })

    it ('Create a DIDDocument with one transaction',async () => {
        const document = await didClient.getDocument()
        console.log('******** Original DIDDocument**********')
        console.log(document)

        // Add signkey
        let context = contextList[0]
        let pubKey = pubKeyList[0]
        document!.verificationMethod!.push({
            id:`${didClient.getDid()}?context=${context}`,
            type: 'EcdsaSecp256k1VerificationKey2019',
            controller: `${didClient.getDid()}`,
            publicKeyHex: `${pubKey}`
        })

        // Add AsymKey
        context = context[1]
        pubKey = pubKeyList[1]
        let id = `${didClient.getDid()}?context=${context}`
        document!.verificationMethod!.push({
            id,
            type: 'X25519KeyAgreementKey2019',
            controller: `${didClient.getDid()}`,
            publicKeyHex: `${pubKey}`
        })

        if (!(document!.keyAgreement)) {
            document!.keyAgreement = []
        }
        document!.keyAgreement.push(id)

        // Add service
        if (!(document!.service)) {
            document!.service = []
        }

        context = contextList[2]
        id = `${didClient.getDid()}?context=${context}&type=message`
        document!.service!.push({
            id,
            type: 'VeridaMessage',
            serviceEndpoint: 'https://db.testnet.verida.io:5002'
        })

        // Save all changes
        await didClient.saveDocument(document!)

        // console.log("Reloading document to check updates")

        // LoadDocument again
        const newDoc = await didClient.reloadDIDDocument()

        console.log('********* Updtated DIDDocument**********')
        console.log(newDoc)
    })

    /*
    it('Creating DID-Client',async () => {
        const document = await didClient.getDocument()

        console.log('TAG', document)
    })

    it('add SignKey test',async () => {
        const document = await didClient.getDocument()
        console.log('******** Original DIDDocument**********')
        console.log(document?.verificationMethod)

        const context = contextList[0]
        const pubKey = pubKeyList[0]
        document!.verificationMethod!.push({
            id:`${didClient.getDid()}?context=${context}`,
            type: 'EcdsaSecp256k1VerificationKey2019',
            controller: `${didClient.getDid()}`,
            publicKeyHex: `${pubKey}`
        })

        // keyPurpose of this attribute will be 'veriKey'
        await didClient.saveDocument(document!)

        // LoadDocument again
        const newDoc = await didClient.reloadDIDDocument()

        console.log('********* Updtated DIDDocument**********')
        console.log(newDoc?.verificationMethod)
    })
    */

    /*
    it('add AsymKey test', async () => {
        const document = await didClient.getDocument()
        console.log('******** Original DIDDocument**********')
        console.log(document?.verificationMethod)
        console.log(document?.keyAgreement)

        const context = contextList[0]
        const pubKey = pubKeyList[0]
        const id = `${didClient.getDid()}?context=${context}`
        document!.verificationMethod!.push({
            id,
            type: 'X25519KeyAgreementKey2019',
            controller: `${didClient.getDid()}`,
            publicKeyHex: `${pubKey}`
        })

        if (!(document!.keyAgreement)) {
            document!.keyAgreement = []
        }
        document!.keyAgreement.push(id)

        // keyPurpose of this attribute will be 'enc'
        await didClient.saveDocument(document!)

        // LoadDocument again
        const newDoc = await didClient.reloadDIDDocument()

        console.log('********* Updtated DIDDocument**********')
        console.log(newDoc?.verificationMethod)
        console.log(document?.keyAgreement)
    })
    */

    /*
    it('add Service Test', async () => {
        const document = await didClient.getDocument()
        console.log('******** Original DIDDocument**********')
        console.log(document?.service)

        if (!(document!.service)) {
            document!.service = []
        }

        const context = contextList[1]
        const id = `${didClient.getDid()}?context=${context}&type=message`
        document!.service!.push({
            id,
            type: 'VeridaMessage',
            serviceEndpoint: 'https://db.testnet.verida.io:5002'
        })

        // keyPurpose of this attribute will be 'enc'
        await didClient.saveDocument(document!)

        // console.log("Reloading document to check updates")

        // LoadDocument again
        const newDoc = await didClient.reloadDIDDocument()

        console.log('********* Updtated DIDDocument**********')
        console.log(newDoc?.service)
    })
    */
})
