/* eslint-disable prettier/prettier */
import { Resolver, Resolvable } from 'did-resolver'
import { Contract, ContractFactory } from '@ethersproject/contracts'
import { InfuraProvider, JsonRpcProvider, Web3Provider } from '@ethersproject/providers'
import { Wallet } from '@ethersproject/wallet'
import { getResolver } from 'ethr-did-resolver'
import { EthrDID, DelegateTypes, KeyPair } from '../index'
import { createProvider, sleep } from './testUtils'
import DidRegistryContract from 'ethr-did-registry'
import { verifyJWT } from 'did-jwt'

import { privateKey } from '/mnt/Work/Sec/mainnet_secret.json'

jest.setTimeout(600000)

describe('EthrDID', () => {
  // https://speedy-nodes-nyc.moralis.io/bd1c39d7c8ee1229b16b4a97/polygon/mumbai
  // https://rpc-mumbai.maticvigil.com
  const rpcUrl = 'https://rpc-mumbai.maticvigil.com'

  const registry = '0x44511bFfDf104fC5f61f74219f65ed4c410d4C20'

  let ethrDid: EthrDID,
    identity: string,
    owner: string,
    provider: JsonRpcProvider,
    txSigner: Wallet

  beforeAll(async () => {

    // Public key
    identity = '0x599b3912A63c98dC774eF3E60282fBdf14cda748'.toLowerCase()
    
    owner = identity
    // owner = '0x2b5ad5c4795c026514f8317c7a215e218dccd6cf'

    /*
    // const provider = new JsonRpcProvider('https://speedy-nodes-nyc.moralis.io/bd1c39d7c8ee1229b16b4a97/polygon/mumbai');
    const provider = new JsonRpcProvider('https://rpc-mumbai.maticvigil.com');

    // Polygon testnet 
    ethrDid = new EthrDID({
      // privateKey,
      // rpcUrl,

      provider,
      chainNameOrId: 80001,
      registry,
      identifier: identity,
      
    })
    */

    // Ethereum RopStep with JSON RPC
    // const provider = new InfuraProvider('https://ropsten.infura.io/v3/5f1154f1b17640568b10a0eed10b1f32', 3)
    // const provider = new InfuraProvider('5f1154f1b17640568b10a0eed10b1f32', 3)
    // const provider = new JsonRpcProvider('https://ropsten.infura.io/v3/5f1154f1b17640568b10a0eed10b1f32', 3)

    provider = new JsonRpcProvider(rpcUrl);

    txSigner = new Wallet(privateKey, provider)
    
    ethrDid = new EthrDID({
      // privateKey,
      txSigner,

      provider,
      
      identifier: identity,
      chainNameOrId : '0x13881',

      rpcUrl,
      registry,
    })
    
    console.log('ethrDID = ', ethrDid.did)
  })

  /*
  it('defaults owner to itself', async () => {
    const prevOwner = await ethrDid.lookupOwner()
    console.log('Prev Owner = ', prevOwner)
    
    // Don't test continuously. Require private key
    await ethrDid.changeOwner(owner)

    const newOwner = await ethrDid.lookupOwner()
    console.log('New Owner = ', newOwner)

  })
  */

  it ('document', async () => {
    const providerConfig = { 
      rpcUrl, 
      registry,
      chainId : 80001,

      provider,
      txSigner,
    }
    const ethrDidResolver = getResolver(providerConfig)
    const didResolver = new Resolver(ethrDidResolver)

    // didResolver.resolve(ethrDid.did).then(
    //   (doc) => console.log
    // )

    const doc = await didResolver.resolve(ethrDid.did)
    console.log('Ethr Doc = ', doc)

    console.log('**************************')

    



    const delegate1 = '0x01298a7ec3e153dac8d0498ea9b40d3a40b51900'

    // Add Verification Method - Delegate
    /*const txHash = await ethrDid.addDelegate(
      delegate1,
      {
        expiresIn: 86400,
      });
    
    await provider.waitForTransaction(txHash)

    const doc1 = await didResolver.resolve(ethrDid.did)

    console.log('Ethr Doc = ', doc1)*/

    // Add Verification Method
    /*
    // Add publicKey
    const  pubKeyList = [
      // '0xfa83bbb792710e80b7605fe4ac680eb7f070ffadcca31aeb0312df80f7361938',
      // '0x029d3638eff201f684e5a9e0ad79373a1ebe14e1d369c0cea0e1f6914792d1f60e',
      // '0x6a3043320fcff32043e20d75727958e25d3613119058f9be77916c635769dc70',
      // '0x027f68efbb37abae2e3d4ef61f2a7c8e2d74b50db6d57791cd0fe7261abfe07862',
      // '0x83f18992724ea6be59c315f1ea6202ce1ec37bed772e12bab9eff2b64decc074',
    ]

    // for (const key in pubKeyList) {
    //   const txHash = await ethrDid.setAttribute(
    //     'did/pub/Secp256k1/veriKey',
    //     key,
    //     86400
    //   )
    //   await provider.waitForTransaction(txHash)
    // }

    // const txHash = await ethrDid.setAttribute(
    //   'did/pub/Secp256k1/veriKey',
    //   '0x83f18992724ea6be59c315f1ea6202ce1ec37bed772e12bab9eff2b64decc074',
    //   86400
    // )
    // await provider.waitForTransaction(txHash)

    console.log(doc)

    console.log(doc.didDocument.verificationMethod)*/

    // Add "VeridatDatabase service"
    // Multiple
    /*const serviceNameList = [
      'did/svc/VeridaDatabase/1', 
      'did/svc/VeridaMessage/2', 
      'did/svc/VeridaDatabase/3', 
      'did/svc/VeridaMessage/4', 
      'did/svc/VeridaDatabase/5', 
      'did/svc/VeridaMessage/6', 
    ]
    for (const name in serviceNameList) {
      const txHash = await ethrDid.setAttribute(
        name, 
        'https://db.testnet.verida.io:5002/', 
        86400
      )
      await provider.waitForTransaction(txHash)
    }*/

    const txHash = await ethrDid.setAttribute(
      'did/svc/VeridaDatabase#0x84e5fb4eb5c3f53d8506e7085dfbb0ef333c5f7d0769bcaf4ca2dc0ca4698fd4#database',
      'https://db.testnet.verida.io:5002/', 
      86400
    )
    await provider.waitForTransaction(txHash)

    // const msgHash = await ethrDid.setAttribute(
    //   'did/svc/VeridaMessage#0x84e5fb4eb5c3f53d8506e7085dfbb0ef333c5f7d0769bcaf4ca2dc0ca4698fd4#messaging', 
    //   'https://db.testnet.verida.io:5002/', 
    //   86400
    // )
    // await provider.waitForTransaction(msgHash)

    console.log(doc)
    console.log(doc.didDocument.verificationMethod)
    console.log(doc.didDocument.service)
  })
  


//   describe('key management', () => {
//     it('test', async () => {
//       await ethrDid.changeOwner(owner)
//     //   console.log('Return = ', await ethrDid.lookupOwner())
//     //   return expect(ethrDid.lookupOwner()).resolves.toEqual(owner)
//     })
//   })
  
})