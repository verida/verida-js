'use strict'
const assert = require('assert')

// import { privateKey } from '/mnt/Work/Sec/test.json'
const { privateKey } = require('/mnt/Work/Sec/test.json')

import { JsonRpcProvider } from '@ethersproject/providers'
import { Wallet } from '@ethersproject/wallet'

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

    it('Creating DID-Client',async () => {
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

        const document = await didClient.getDocument()

        console.log('TAG', document)
    })
})

/**
 * 
 */
// describe('DID document tests', () => {

//     describe('Document creation', function() {
//         it('can create an empty document', async function() {
//             const doc = new DIDDocument(did, wallet.publicKey)
//             didClient.authenticate(wallet.privateKey)
//             const saved = await didClient.save(doc)

//             assert.ok(saved)
//         })

//         it('can fetch an existing document', async function() {
//             const doc = await didClient.get(did)
//             assert.ok(doc)

//             assert.equal(doc.id, did, 'Retreived document has matching DID')
//         })

//         it('can add a context to an existing DID and verify', async function() {
//             const initialDoc = new DIDDocument(did, wallet.publicKey)
//             await initialDoc.addContext(CONTEXT_NAME, keyring, endpoints)
//             didClient.authenticate(wallet.privateKey)
//             const saved = await didClient.save(initialDoc)

//             assert.ok(saved)

//             const doc = await didClient.get(did)
//             const data = doc.export()

//             const contextHash = DIDDocument.generateContextHash(did, CONTEXT_NAME)

//             // Validate service endpoints
//             assert.equal(data.service.length, 2, "Have two service entries")
//             function validateServiceEndpoint(type, endpointUri, actual: ServiceEndpoint) {
//                 assert.ok(actual)
//                 assert.equal(actual.id, `${did}?context=${contextHash}#${type}`, "Endpoint ID matches hard coded value")
//                 assert.equal(actual.type, type, "Type has expected value")
//                 assert.equal(actual.serviceEndpoint, endpointUri, "Endpoint has expected value")
//             }

//             const endpoint1 = doc.locateServiceEndpoint(CONTEXT_NAME, EndpointType.DATABASE)
//             validateServiceEndpoint(endpoints.database.type, endpoints.database.endpointUri, endpoint1)

//             const endpoint2 = doc.locateServiceEndpoint(CONTEXT_NAME, EndpointType.MESSAGING)
//             validateServiceEndpoint(endpoints.messaging.type, endpoints.messaging.endpointUri, endpoint2)

//             // @todo: validate verification method
//             assert.equal(data.verificationMethod.length, 3, "Have three verificationMethod entries")
//         })

//         it('can handle invalid DIDs', async function() {
//             const doc1 = await didClient.get(`did:vda:0xabcd`)
//             assert.ok(!doc1, 'Document not returned')

//             const doc2 = await didClient.get(`did:vda`)
//             assert.ok(!doc2, 'Document not returned')

//             let success = true
//             try {
//                 const doc3 = await didClient.get("")
//                 success = false
//             } catch(err) {
//                 if (err.message == `No DID specified`) {
//                     success = true
//                 } else {
//                     success = false
//                 }
                
//             }

//             assert.ok(success, 'Error is thrown with empty DID request')
//         })

//         it('can replace an existing context, not add again', async function() {
//             const doc = new DIDDocument(did, wallet.publicKey)
//             await doc.addContext(CONTEXT_NAME, keyring, endpoints)
//             didClient.authenticate(wallet.privateKey)
//             let saved = await didClient.save(doc)
//             assert.ok(saved)

//             // Add the same context and save a second time
//             await doc.addContext(CONTEXT_NAME, keyring, endpoints)
//             saved = await didClient.save(doc)
//             assert.ok(saved)

//             const data = doc.export()
//             assert.equal(data.verificationMethod.length, 3, 'Have three verification methods')
//             assert.equal(data.assertionMethod.length, 2, 'Have two assertionMethods')
//             assert.equal(data.keyAgreement.length, 1, 'Have one keyAgreement')
//         })
//     })

// })