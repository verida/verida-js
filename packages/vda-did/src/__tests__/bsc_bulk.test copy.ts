/* eslint-disable prettier/prettier */
import { Resolver, Resolvable } from 'did-resolver'
import { Contract, ContractFactory } from '@ethersproject/contracts'
import { InfuraProvider, JsonRpcProvider, Web3Provider } from '@ethersproject/providers'
import { Wallet } from '@ethersproject/wallet'
// import { getResolver } from 'ethr-did-resolver'
import { getResolver } from 'ethr-did-resolver'

import { EthrDID, BulkDelegateParam, BulkAttributeParam, DelegateTypes } from '../index'

import { privateKey } from '/mnt/Work/Sec/test.json'

jest.setTimeout(600000)

describe('EthrDID', () => {

  const rpcUrl = 'https://speedy-nodes-nyc.moralis.io/bd1c39d7c8ee1229b16b4a97/bsc/testnet'

  const registry = '0x258A75E9DF2F3BfB8b0854A7A7003044B3d94e0E'

  // Wallet addresses
  const delegate1 = '0x01298a7ec3e153dac8d0498ea9b40d3a40b51900'

  let ethrDid: EthrDID,
    identity: string,
   
    provider: JsonRpcProvider,
    txSigner: Wallet

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
      chainNameOrId : '0x61',

      rpcUrl,
      registry,
    })
  })

  describe('bulkAdd', () => {
    // let didResolver,
    let doc

    beforeAll(async () => {
      const providerConfig = { 
        rpcUrl, 
        registry,
        chainId : 97,
  
        provider,
        txSigner,
      }
      const ethrDidResolver = getResolver(providerConfig)
      const didResolver = new Resolver(ethrDidResolver)

      doc = await didResolver.resolve(ethrDid.did)
    })

    it ('bulkAdd test', async () => {
      // Verification Method
      const dParams : BulkDelegateParam[] = []
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

      const aParams: BulkAttributeParam[] = []
      /*
      aParams.push(
        // Service
        {
          key: 'did/svc/VeridaDatabase',
          value: 'https://db.testnet.verida.io:5002##' + context + '##database'
          // expiresIn? 
        },{
          key: 'did/svc/VeridaMessage',
          value: 'https://db.testnet.verida.io:5002##' + context + '##messaging'
        },{
          key: 'did/svc/VeridaNotification',
          value: 'https://notification.testnet.verida.io:5002##' + context + '##notification'
        },{
          key: 'did/svc/VeridaStorage',
          value: 'https://storage.testnet.verida.io:5002##' + context + '##storage'
        },{
          key: 'did/svc/BlockchainAddress',
          value: '0x01298a7ec3e153dac8d0498ea9b40d3a40b51900##' + context + '##ethereum:eip155-1'
        },
      )
      */

      
      const startTime = Date.now()
      console.log('Start : ', startTime)

      const txHash = await ethrDid.bulkAdd(
        dParams,
        aParams,
      )
      await provider.waitForTransaction(txHash)

      const endTime = Date.now()
      console.log('End : ', endTime)
  
      console.log('Time Consumed: ', endTime - startTime)
      
     
      console.log("Result:", doc)
      // console.log(doc.didDocument.verificationMethod)
      // console.log(doc.didDocument.service)
    })

    /*
    it ('Add verification method - Delegate', async () => {
      const delegate1 = '0x01298a7ec3e153dac8d0498ea9b40d3a40b51900'

      const txHash = await ethrDid.addDelegate(
        delegate1,
        {
          expiresIn: 86400,
        });
      
      await provider.waitForTransaction(txHash)
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
        const txHash = await ethrDid.setAttribute(
          'did/pub/Secp256k1/veriKey',
          key,
          86400
        )
        await provider.waitForTransaction(txHash)
      }

      // const txHash = await ethrDid.setAttribute(
      //   'did/pub/Secp256k1/veriKey',
      //   '0x83f18992724ea6be59c315f1ea6202ce1ec37bed772e12bab9eff2b64decc074',
      //   86400
      // )
      // await provider.waitForTransaction(txHash)

      console.log(doc)

      console.log(doc.didDocument.verificationMethod)
    })

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

      for (const context in contextList) {
        const msgHash = await ethrDid.setAttribute(
          keyList[0], 
          serviceEndPoint + '##' + context + '##messaging', 
          86400
        )
        await provider.waitForTransaction(msgHash)
    
        const txHash = await ethrDid.setAttribute(
          keyList[1],
          serviceEndPoint + '##' + context + '##database',
          86400
        )
        await provider.waitForTransaction(txHash)
      }  

      // console.log(doc)
      // console.log(doc.didDocument.verificationMethod)
      console.log(doc.didDocument.service)
    })

    it('Time measure for adding service', async () => {
      const msgHash = await ethrDid.setAttribute(
        'did/svc/VeridaMessage', 
        'https://db.testnet.verida.io:5002##0x84e5fb4eb5c3f53d8506e7085dfbb0ef333c5f7d0769bcaf4ca2dc0ca4600003##messaging', 
        86400
      )
      await provider.waitForTransaction(msgHash)
  
      const startTime = Date.now()
      console.log('Start : ', startTime)
      const txHash = await ethrDid.setAttribute(
        'did/svc/VeridaDatabase',
        'https://db.testnet.verida.io:5002##0x84e5fb4eb5c3f53d8506e7085dfbb0ef333c5f7d0769bcaf4ca2dc0ca4600004##database',
        86400
      )
      await provider.waitForTransaction(txHash)
      const endTime = Date.now()
      console.log('End : ', endTime)
  
      console.log('Time Consumed: ', endTime - startTime)
    })
    */
  })

  

//   describe('key management', () => {
//     it('test', async () => {
//       await ethrDid.changeOwner(owner)
//     //   console.log('Return = ', await ethrDid.lookupOwner())
//     //   return expect(ethrDid.lookupOwner()).resolves.toEqual(owner)
//     })
//   })
  
})