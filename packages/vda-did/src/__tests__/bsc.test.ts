/* eslint-disable prettier/prettier */
import { Resolver, Resolvable } from 'did-resolver'
import { JsonRpcProvider } from '@ethersproject/providers'
import { Wallet } from '@ethersproject/wallet'
import { getResolver } from 'vda-did-resolver'

import { VdaDID, DelegateTypes, KeyPair } from '../index'
import DidRegistryContract from 'ethr-did-registry'
import { verifyJWT } from 'did-jwt'

import { privateKey } from '/mnt/Work/Sec/test.json'

// const rpcUrl = 'https://speedy-nodes-nyc.moralis.io/bd1c39d7c8ee1229b16b4a97/bsc/testnet'
const rpcUrl = 'https://speedy-nodes-nyc.moralis.io/20cea78632b2835b730fdcf4/bsc/testnet'

// Paid BSC RPC
// https://speedy-nodes-nyc.moralis.io/24036fe0cb35ad4bdc12155f/bsc/mainnet
// https://speedy-nodes-nyc.moralis.io/20cea78632b2835b730fdcf4/bsc/testnet
const registry = '0x2862BC860f55D389bFBd1A37477651bc1642A20B'

const identity = '0x599b3912A63c98dC774eF3E60282fBdf14cda748'.toLowerCase()
const owner = identity;

const provider = new JsonRpcProvider(rpcUrl);

const txSigner = new Wallet(privateKey, provider)
    
const vdaDid = new VdaDID({
  identifier: identity,
  chainNameOrId : '0x61',     
  
  callType: 'web3',
  web3Options: {
    provider: provider,
    signer: txSigner
  }
})


jest.setTimeout(600000)

describe('VdaDID', () => {
  /*
  it('defaults owner to itself', async () => {
    const prevOwner = await vdaDid.lookupOwner()
    console.log('Prev Owner = ', prevOwner)
    
    // Don't test continuously. Require private key
    await vdaDid.changeOwner(owner)

    const newOwner = await vdaDid.lookupOwner()
    console.log('New Owner = ', newOwner)

  })
  */

  describe('Document', () => {
    // let didResolver,
    let doc

    beforeAll(async () => {
      const providerConfig = { 
        rpcUrl, 
        registry,
        chainId : 97,
      }
      const vdaDidResolver = getResolver(providerConfig)
      const didResolver = new Resolver(vdaDidResolver)

      doc = await didResolver.resolve(vdaDid.did)

      console.log("###################Resolved Doc###########", doc)
      console.log("###################Verification###########", doc.didDocument.verificationMethod)
      console.log("###################Authentication###########", doc.didDocument.authentication)
      console.log("###################Service###########", doc.didDocument.service)
    })

    it ('Add verification method - Delegate', async () => {
      const delegate1 = '0x01298a7ec3e153dac8d0498ea9b40d3a40b51900'

      const txHash = await (vdaDid.addDelegate(
        delegate1,
        {
          expiresIn: 86400,
        }));

      console.log('TxHash -- ', txHash)
      
      // await provider.waitForTransaction(txHash)
    })

    it ('Add verification method', async() => {
      // Add publicKey
      const  pubKeyList = [
        '0xfa83bbb792710e80b7605fe4ac680eb7f070ffadcca31aeb0312df80f7361938',
        '0x029d3638eff201f684e5a9e0ad79373a1ebe14e1d369c0cea0e1f6914792d1f60e',
        '0x6a3043320fcff32043e20d75727958e25d3613119058f9be77916c635769dc70',
        '0x027f68efbb37abae2e3d4ef61f2a7c8e2d74b50db6d57791cd0fe7261abfe07862',
        '0x83f18992724ea6be59c315f1ea6202ce1ec37bed772e12bab9eff2b64decc074',
      ]

      for (const key in pubKeyList) {
        const txHash = await vdaDid.setAttribute(
          'did/pub/Secp256k1/veriKey',
          key,
          86400
        )
        // console.log('TxHash -- ', txHash)
        // await provider.waitForTransaction(txHash)
      }

      console.log(doc)

      // console.log(doc.didDocument.verificationMethod)
    })
    
    /*
    it('Add multiple service by for loop',async () => {
      const keyList = [
        'did/svc/VeridaMessage',
        'did/svc/VeridaDatabase',
      ]

      const contextList = [
        '0x84e5fb4eb5c3f53d8506e7085dfbb0ef333c5f7d0769bcaf4ca2dc0ca4698fd4',
        '0xcfbf4621af64386c92c0badd0aa3ae3877a6ea6e298dfa54aa6b1ebe00769b28',
        '0x55418c45e3ad1ba47c69f266d6c49c589b9d70de837e318c78ff43c7f0ba89c8'
      ]

      const serviceEndPoint = 'https://db.testnet.verida.io:5002'

      // console.log("==========vdaDID", vdaDid)

      for (const context in contextList) {
        const msgHash = await vdaDid.setAttribute(
          keyList[0], 
          serviceEndPoint + '##' + context + '##messaging', 
          86400
        )

        // console.log('messaging : ', msgHash)
    
        const txHash = await vdaDid.setAttribute(
          keyList[1],
          serviceEndPoint + '##' + context + '##database',
          86400
        )
        // console.log('database : ', txHash)
      }  

      // console.log(doc)
      console.log(doc.didDocument.verificationMethod)
      console.log(doc.didDocument.service)
    })
    */
    
    it('Time measure for adding service', async () => {
      const msgHash = await vdaDid.setAttribute(
        'did/svc/VeridaMessage', 
        'https://db.testnet.verida.io:5002##0x84e5fb4eb5c3f53d8506e7085dfbb0ef333c5f7d0769bcaf4ca2dc0ca4600003##messaging', 
        86400
      )
      console.log(msgHash)
      // await provider.waitForTransaction(msgHash)
  
      const startTime = Date.now()
      console.log('Start : ', startTime)
      const txHash = await vdaDid.setAttribute(
        'did/svc/VeridaDatabase',
        'https://db.testnet.verida.io:5002##0x84e5fb4eb5c3f53d8506e7085dfbb0ef333c5f7d0769bcaf4ca2dc0ca4600004##database',
        86400
      )
      console.log(txHash)
      // await provider.waitForTransaction(txHash)
      const endTime = Date.now()
      console.log('End : ', endTime)
  
      console.log('Time Consumed: ', endTime - startTime)
    })
  })

  

//   describe('key management', () => {
//     it('test', async () => {
//       await vdaDid.changeOwner(owner)
//     //   console.log('Return = ', await vdaDid.lookupOwner())
//     //   return expect(vdaDid.lookupOwner()).resolves.toEqual(owner)
//     })
//   })
  
})