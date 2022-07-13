/* eslint-disable prettier/prettier */
import { Resolver, Resolvable } from 'did-resolver'
import { Contract, ContractFactory } from '@ethersproject/contracts'
import { InfuraProvider, JsonRpcProvider, Web3Provider } from '@ethersproject/providers'
import { Wallet } from '@ethersproject/wallet'
// import { getResolver } from 'ethr-did-resolver'
import { getResolver } from 'ethr-did-resolver'

import { EthrDID, BulkDelegateParam, BulkAttributeParam, BulkSignedDelegateParam, BulkSignedAttributeParam, DelegateTypes } from '../index'

import { privateKey } from '/mnt/Work/Sec/test.json'

import {
  arrayify,
  BytesLike,
  concat,
  formatBytes32String,
  hexConcat,
  hexlify,
  hexZeroPad,
  keccak256,
  parseBytes32String,
  SigningKey,
  toUtf8Bytes,
  zeroPad,
} from 'ethers/lib/utils'

jest.setTimeout(600000)

describe('EthrDID', () => {

  const rpcUrl = 'https://polygon-rpc.com/'
  // const rpcUrl = 'https://polygon-mainnet.g.alchemy.com/v2/JT3kfJ7hivnlA2dtPNpw3ahJCjhW26EV'

  // Contract address deployed
  // bulkAdd with 2 param
  // const registry = '0xF1BfbE384517c10f6839606CFAcf6854f0F40876'
  const registry = '0xAe8c7BBA52Dfc2346dCa38840389495D38eE7C7c'
  
  // Wallet addresses
  const delegate1 = '0x01298a7ec3e153dac8d0498ea9b40d3a40b51900'

  let ethrDid: EthrDID,
    identity: string,
   
    provider: JsonRpcProvider,
    txSigner: Wallet

  // Data for Signing Transaction
  const signerPrivateKey = arrayify('0xa285ab66393c5fdda46d6fbad9e27fafd438254ab72ad5acb681a0e9f20f5d7b')
  const signerAddress = '0x2036C6CD85692F0Fb2C26E6c6B2ECed9e4478Dfd'

  // Function to sign data
  const signData = async (
    identity: string,
    // signerAddress: string,
    privateKeyBytes: Uint8Array,
    dataBytes: Uint8Array,
    nonce: number
  ) => {
    const paddedNonce = zeroPad(arrayify(nonce), 32)
    const dataToSign = hexConcat(['0x1900', registry, paddedNonce, identity, dataBytes])
    const hash = keccak256(dataToSign)
    return new SigningKey(privateKeyBytes).signDigest(hash)
  }
    

  beforeAll(async () => {
    // Public key
    identity = '0x599b3912A63c98dC774eF3E60282fBdf14cda748'.toLowerCase()

    provider = new JsonRpcProvider(rpcUrl);

    txSigner = new Wallet(privateKey, provider)
    
    ethrDid = new EthrDID({
      // privateKey,
      txSigner,

      provider,
      
      identifier: identity,
      chainNameOrId : '0x89',

      rpcUrl,
      registry,
    })
  })

  describe('bulk Transactions', () => {
    // let didResolver,
    let doc

    const dParams: BulkDelegateParam[] = []
    const aParams: BulkAttributeParam[] = []

    beforeAll(async () => {
      const providerConfig = { 
        rpcUrl, 
        registry,
        chainId : 137,
  
        provider,
        txSigner,
      }
      const ethrDidResolver = getResolver(providerConfig)
      const didResolver = new Resolver(ethrDidResolver)

      console.log("Resolve document");

      doc = await didResolver.resolve(ethrDid.did)

      console.log("Resolve document done");

      // Add Test datas to add & revoke
      // Verification Method
      // Add keyagreement
      dParams.push(
        {
          delegate: delegate1,
          delegateType: DelegateTypes.enc,
        }
      )
      /*
      dParams.push(
      // Verification method
      {
        // delegateType: = DelegateTypes.veriKey // By default
        delegate: delegate1,
        // expiresIn: = 86400 // By default
      }, 
      // Authentication method
      {
        delegateType: DelegateTypes.sigAuth,
        delegate: delegate1
      })
      */

      const context = '0x84e5fb4eb5c3f53d8506e7085dfbb0ef333c5f7d0769bcaf4ca2dc0ca4698fd4'
      aParams.push(
        // Service
        {
          name: 'did/svc/VeridaDatabase',
          value: 'https://db.testnet.verida.io:5002##' + context + '##database'
          // expiresIn? 
        },{
          name: 'did/svc/VeridaMessage',
          value: 'https://db.testnet.verida.io:5002##' + context + '##messaging'
        },{
          name: 'did/svc/VeridaNotification',
          value: 'https://notification.testnet.verida.io:5002##' + context + '##notification'
        },{
          name: 'did/svc/VeridaStorage',
          value: 'https://storage.testnet.verida.io:5002##' + context + '##storage'
        },{
          name: 'did/svc/BlockchainAddress',
          value: '0x01298a7ec3e153dac8d0498ea9b40d3a40b51900##' + context + '##ethereum:eip155-1'
        },
      )
    })

    // Simple test: Working 
    it('addDelegate',async () => {
      const startTime = Date.now()
      console.log('Start : ', startTime)

      const txHash = await ethrDid.addDelegate(
        delegate1
      )
      await provider.waitForTransaction(txHash)

      const endTime = Date.now()
      console.log('End : ', endTime)
  
      console.log('addDelegate() Time Consumed: ', endTime - startTime)
    })
   
    it ('bulkAdd test', async () => {
      let nonce = Number(await ethrDid.nonce(signerAddress));

      const sig = await signData(
        signerAddress,
        signerPrivateKey,
        concat([
          toUtf8Bytes('addDelegate'),
          formatBytes32String('attestor'),
          delegate1,
          zeroPad(hexlify(86400), 32),
        ]),
        nonce++
      )
      
      const signedDParams : BulkSignedDelegateParam[] = [
        {
          identity: signerAddress,
          sigV: sig.v,
          sigR: sig.r,
          sigS: sig.s,
          delegateType: formatBytes32String('attestor'),
          delegate: delegate1,
          validity: 86400,
        }
      ]


      const sig2 = await signData(
        signerAddress,
        // signerAddress,
        signerPrivateKey,
        concat([
          toUtf8Bytes('setAttribute'),
          formatBytes32String('encryptionKey'),
          toUtf8Bytes('mykey'),
          zeroPad(hexlify(86400), 32),
        ]),
        nonce++
      )

      const signedAParams : BulkSignedAttributeParam[] = [
        {
          identity: signerAddress,
          sigV: sig2.v,
          sigR: sig2.r,
          sigS: sig2.s,
          name: formatBytes32String('encryptionKey'),
          value: toUtf8Bytes('mykey'),
          validity: 86400,
        }
      ]

      
      const startTime = Date.now()
      console.log('Start : ', startTime)

      const txHash = await ethrDid.bulkAdd(
        dParams,
        aParams,
        signedDParams,
        signedAParams
      )
      await provider.waitForTransaction(txHash)

      const endTime = Date.now()
      console.log('End : ', endTime)
  
      console.log('bulkAdd() Time Consumed: ', endTime - startTime)
      
      // console.log("Result:", doc)
      // console.log(doc.didDocument.verificationMethod)
      // console.log(doc.didDocument.service)
    })


    it ('bulkRevoke test', async () => {
      let nonce = Number(await ethrDid.nonce(signerAddress));

      const sig = await signData(
        signerAddress,
        signerPrivateKey,
        concat([
          toUtf8Bytes('revokeDelegate'),
          formatBytes32String('attestor'),
          delegate1,
        ]),
        nonce++
      )
      
      const signedDParams : BulkSignedDelegateParam[] = [
        {
          identity: signerAddress,
          sigV: sig.v,
          sigR: sig.r,
          sigS: sig.s,
          delegateType: formatBytes32String('attestor'),
          delegate: delegate1,
        }
      ]


      const sig2 = await signData(
        signerAddress,
        // signerAddress,
        signerPrivateKey,
        concat([
          toUtf8Bytes('revokeAttribute'),
          formatBytes32String('encryptionKey'),
          toUtf8Bytes('mykey'),
        ]),
        nonce++
      )

      const signedAParams : BulkSignedAttributeParam[] = [
        {
          identity: signerAddress,
          sigV: sig2.v,
          sigR: sig2.r,
          sigS: sig2.s,
          name: formatBytes32String('encryptionKey'),
          value: toUtf8Bytes('mykey'),
        }
      ]

      
      const startTime = Date.now()
      console.log('Revoke Start : ', startTime)

      const txHash = await ethrDid.bulkRevoke(
        dParams,
        aParams,
        signedDParams,
        signedAParams
      )
      await provider.waitForTransaction(txHash)

      const endTime = Date.now()
      console.log('Revoke End : ', endTime)
  
      console.log('bulkRevoke() Revoke Time Consumed: ', endTime - startTime)
      
      // console.log("Revoke Result:", doc)
      // console.log(doc.didDocument.verificationMethod)
      // console.log(doc.didDocument.service)
    })
  })

//   describe('key management', () => {
//     it('test', async () => {
//       await ethrDid.changeOwner(owner)
//     //   console.log('Return = ', await ethrDid.lookupOwner())
//     //   return expect(ethrDid.lookupOwner()).resolves.toEqual(owner)
//     })
//   })
  
})