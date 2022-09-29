'use strict'
const assert = require('assert')

import { JsonRpcProvider } from '@ethersproject/providers'
import { Wallet } from '@ethersproject/wallet'
import { EndpointType } from '@verida/did-document/src/interfaces'
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
console.log('RPC URL :', rpcUrl)

const registry = process.env[`CONTRACT_ADDRESS_${currentNet}_DidRegistry`]
if (registry === undefined) {
    throw new Error("Registry address not defined in env")
}
console.log('Contract : ', registry)

const identity = new Wallet(veridaPrivateKey).address

// @bug: This causes issues because our DID resolver expects `did:ethr`. This needs to be fixed in vda-did-resolver
const did = `did:ethr:${identity}`

const provider = new JsonRpcProvider(rpcUrl);
const txSigner = new Wallet(privateKey, provider)

console.log("Signer : ", txSigner.address)


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
            connectMode: 'direct',
            network: 'testnet',
            rpcUrl
        })
        console.log('DIDClient created successfully')
    })

    it ('Create a DIDDocument with one transaction',async () => {
        const document = await didClient.get(did)
        console.log('******** Original DIDDocument**********')
        console.log(document)

        /*
        // Add signkey
        let context = contextList[0]
        let pubKey = pubKeyList[0]
        document.addContextSignKey(context, pubKey)
        
        // Add AsymKey
        context = context[1]
        pubKey = pubKeyList[1]
        document.addContextAsymKey(context, pubKey)
        
        // Add service
        document.addContextService(
            context, 
            EndpointType.MESSAGING,
            'VeridaMessage',
            'https://db.testnet.verida.io:5002')

        didClient.authenticate(
            veridaPrivateKey,
            'web3',
            {
                signer: txSigner
            }
        )

        // Save all changes
        await didClient.save(document!)

        // console.log("Reloading document to check updates")
        */

        didClient.authenticate(
            veridaPrivateKey,
            'web3',
            {
                signer: txSigner
            }
        )

        // LoadDocument again
        const newDoc = await didClient.get()

        console.log('********* Updtated DIDDocument**********')
        console.log(newDoc)
        
    })

    /*
    it('add SignKey test',async () => {
        const document = await didClient.get()
        console.log('******** Original DIDDocument**********')
        console.log(document.export().verificationMethod)

        const context = contextList[0]
        const pubKey = pubKeyList[0]
        document.addContextSignKey(context, pubKey)

        // Unlock save feature
        didClient.authenticate(
            veridaPrivateKey,
            'web3',
            {
                signer: txSigner
            }
        )
        // keyPurpose of this attribute will be 'veriKey'
        await didClient.save(document!)

        // LoadDocument again
        const newDoc = await didClient.get()

        console.log('********* Updtated DIDDocument**********')
        console.log(newDoc.export().verificationMethod)
    })

    it('add AsymKey test', async () => {
        const document = await didClient.get()
        console.log('******** Original DIDDocument**********')
        console.log(document.export().verificationMethod)
        console.log(document.export().keyAgreement)

        const context = contextList[0]
        const pubKey = pubKeyList[0]
        document.addContextAsymKey(context, pubKey)

        // Unlock save feature
        didClient.authenticate(
            veridaPrivateKey,
            'web3',
            {
                signer: txSigner
            }
        )
        // keyPurpose of this attribute will be 'enc'
        await didClient.save(document!)

        // LoadDocument again
        const newDoc = await didClient.get()

        console.log('********* Updtated DIDDocument**********')
        console.log(newDoc.export().verificationMethod)
        console.log(newDoc.export().keyAgreement)
    })

    it('add Service Test', async () => {
        const document = await didClient.get()
        console.log('******** Original DIDDocument**********')
        console.log(document.export().service)

        if (!(document!.service)) {
            document!.service = []
        }

        const context = contextList[1]
        document.addContextService(
            context,
            EndpointType.MESSAGING,
            'VeridaMessage',
            'https://db.testnet.verida.io:5002'
        )
        
        // Unlock save feature
        didClient.authenticate(
            veridaPrivateKey,
            'web3',
            {
                signer: txSigner
            }
        )
        // keyPurpose of this attribute will be 'enc'
        await didClient.save(document!)

        // LoadDocument again
        const newDoc = await didClient.get()

        console.log('********* Updtated DIDDocument**********')
        console.log(newDoc.export().service)
    })
    */
})
