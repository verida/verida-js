'use strict'
const assert = require('assert')

// import { privateKey } from '/mnt/Work/Sec/test.json'
const { privateKey } = require('/mnt/Work/Sec/test.json')

import { JsonRpcProvider } from '@ethersproject/providers'
import { Wallet } from '@ethersproject/wallet'
import { VdaDID } from '@verida/vda-did'

import { DIDClient, createDIDClient } from "../src/index"

require('dotenv').config()

const veridaPrivateKey = '0x' + privateKey

const rpcUrl = 'https://speedy-nodes-nyc.moralis.io/20cea78632b2835b730fdcf4/bsc/testnet'
const currentNet = process.env.RPC_TARGET_NET != undefined ? process.env.RPC_TARGET_NET : 'RPC_URL_POLYGON_MAINNET'
const registry = process.env[`CONTRACT_ADDRESS_${currentNet}_DidRegistry`]
if (registry === undefined) {
    throw new Error("Registry address not defined in env")
}

const identity = '0x599b3912A63c98dC774eF3E60282fBdf14cda748'.toLowerCase()
const provider = new JsonRpcProvider(rpcUrl);
const txSigner = new Wallet(privateKey, provider)


describe('DID Document tests', () => {
    let didClient

    before(async () => {
        console.log('Creating DIDClient for test')
        didClient = await createDIDClient({
            veridaPrivateKey,
        
            // vda-did resolver - only
            identifier : identity, // DID
            // chainName? : string, 
            chainId : '0x61',
        
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

    it('Creating DID-Client',async () => {
        const document = await didClient.getDocument()

        console.log('TAG', document)
    })

    /*
    it('add SignKey test',async () => {
        const document = await didClient.getDocument()
        console.log('******** Original DIDDocument**********')
        console.log(document?.verificationMethod)

        const context = '0x888888eb5c3f53d8506e7085dfbb0ef333c5f7d0769bcaf4ca2dc0ca46d00001'
        const pubKey = '0x999999b792710e80b7605fe4ac680eb7f070ffadcca31aeb0312df80f7300001'
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

        const context = '0x888888eb5c3f53d8506e7085dfbb0ef333c5f7d0769bcaf4ca2dc0ca46d00001'
        const pubKey = '0x999999b792710e80b7605fe4ac680eb7f070ffadcca31aeb0312df80f7300001'
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

    it('add Service Test', async () => {
        const document = await didClient.getDocument()
        console.log('******** Original DIDDocument**********')
        console.log(document?.service)

        if (!(document!.service)) {
            document!.service = []
        }

        const context = '0x777777eb5c3f53d8506e7085dfbb0ef333c5f7d0769bcaf4ca2dc0ca46d00002'
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
})
