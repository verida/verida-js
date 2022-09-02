/* eslint-disable prettier/prettier */
import { Resolver } from 'did-resolver'
import { JsonRpcProvider } from '@ethersproject/providers'
import { Wallet } from '@ethersproject/wallet'
import { getResolver } from '@verida/vda-did-resolver'

import { VdaDID, DelegateTypes, BulkDelegateParam, BulkAttributeParam } from '../index'

import { ethers } from 'ethers'

import {
  getVeridaSign, 
  delegates, 
  attributes, 
  pubKeyList,
} from './const'


const testMode = process.env.TEST_MODE ? process.env.TEST_MODE : 'direct'

let privateKey = process.env.PRIVATE_KEY
if (privateKey === undefined)
  throw new Error('Private key not defined in env')
if (!privateKey.startsWith('0x'))
  privateKey = '0x' + privateKey

const currentNet = process.env.RPC_TARGET_NET != undefined ? process.env.RPC_TARGET_NET : 'RPC_URL_POLYGON_MAINNET'
const rpcUrl = process.env[currentNet]
if(rpcUrl === undefined)
  throw new Error("RPC url not defined in env")

const registry = process.env[`CONTRACT_ADDRESS_${currentNet}_DidRegistry`]
if (registry === undefined) {
  throw new Error("Registry address not defined in env")
}

const chainId = process.env[`CHAIN_ID_${currentNet}`]
if (chainId === undefined) {
  throw new Error('Chain ID not defined in env')
}

const identity = new Wallet(privateKey.slice(2)).address.toLowerCase()

const provider = new JsonRpcProvider(rpcUrl);
const txSigner = new Wallet(privateKey.slice(2), provider)

    
const vdaDid = testMode === 'direct' ? 
  new VdaDID({
    identifier: identity,
    vdaKey: privateKey,
    chainNameOrId : chainId,
    
    callType: 'web3',
    web3Options: {
      provider: provider,
      signer: txSigner
    }
  }) : 
  new VdaDID({
    identifier: identity,
    vdaKey: privateKey,
    chainNameOrId : chainId,
    
    callType: 'gasless',
    web3Options: {
      veridaKey: 'Input your Verida API key',
      serverConfig: {
        headers: {
            'context-name' : 'Verida Test'
        } 
      },
      postConfig: {
          headers: {
              'user-agent': 'Verida-Vault'
          }
      }
    }
  })

function sleep(ms) {
  return new Promise((resolve) => {
      setTimeout(resolve, ms);
  });
}

const getDelegateType = (delegateType: string) => {
  if (delegateType === 'sigAuth') {
    return DelegateTypes.sigAuth
  } else if (delegateType === 'enc') {
    return DelegateTypes.enc
  }
  return DelegateTypes.veriKey
}

jest.setTimeout(600000)

describe('VdaDID', () => {
  let doc
  let didResolver

  const getProof = (did: string, pubKeyAddr: string, signKey: string ) => {
    const proofRawMsg = ethers.utils.solidityPack(
      ['address', 'address'],
      [did, pubKeyAddr]
    )
    return getVeridaSign(proofRawMsg, signKey)
  }

  beforeAll(async () => {
    const providerConfig = { 
      rpcUrl, 
      registry,
      chainId : chainId,
    }
    const vdaDidResolver = getResolver(providerConfig)
    didResolver = new Resolver(vdaDidResolver)
  })

  describe('Delegate test', () => {
    const delegate = delegates[0].delegate
    const delegateType = DelegateTypes.veriKey

    it('Add delegate', async () => {
      const result = await vdaDid.addDelegate(
        delegate,
        delegateType,
        86400
      )

      expect(result.success).toEqual(true)
    })

    it('Revoke delegate', async () => {

      const result = await vdaDid.revokeDelegate( delegate, delegateType )

      expect(result.success).toEqual(true)
     
    })
  })

  describe('Attribute test', () => {
    it ('set Attributes',async () => {
      for (let i = 0; i < 3; i++) {
        const pubKeyAddr = ethers.utils.computeAddress(pubKeyList[i])
        const proof = getProof(identity, pubKeyAddr, privateKey!)
        const result = await vdaDid.setAttribute(
          <string>attributes[i].name,
          <string>attributes[i].value,
          proof
        )
        expect(result.success).toEqual(true)
      }      
    })

    it ('revoke Attributes', async () => {
      for (let i = 0; i < 3; i++) {
        const result = await vdaDid.revokeAttribute(
          <string>attributes[i].name,
          <string>attributes[i].value,
        )
        expect(result.success).toEqual(true)
      }
    })
  })

  describe('Srvices test', () => {
    const keyList = [
      'did/svc/VeridaMessage',
      'did/svc/VeridaDatabase',
    ]
    const typeList = [
      'message',
      'database'
    ]
    const contextList = [
      Wallet.createRandom().address,
      Wallet.createRandom().address,
    ]

    const serviceEndPoint = 'https://db.testnet.verida.io:5002'

    it ('add sevices', async () => {
      for (let i = 0; i < keyList.length; i++) {
        const paramVale = `${serviceEndPoint}?context=${contextList[i]}&type=${typeList[i]}`
        const result = await vdaDid.setAttribute(
          keyList[i],
          paramVale
        )
        expect(result.success).toEqual(true)
      }
    })

    it ('revoke sevices', async () => {
      for (let i = 0; i < 2; i++) {
        const paramVale = `${serviceEndPoint}?context=${contextList[i]}&type=${typeList[i]}`
        const result = await vdaDid.revokeAttribute(
          keyList[i],
          paramVale
        )
        expect(result.success).toEqual(true)
      }
    })
  })

  describe('Bulk test', () => {
    const bulkDelegateParams = [
      delegates[0],
      delegates[1]
    ]
    const bulkAttrParams = [
      attributes[0]
    ]

    it("bulkAdd test",async () => {
      const addDelegateParams: BulkDelegateParam[] = []
      bulkDelegateParams.forEach(item => 
        addDelegateParams.push({
          delegate: item.delegate,
          delegateType: getDelegateType(<string>item.delegateType),
          validity: item.validity
        })
      )

      const proofAddress = ethers.utils.computeAddress(pubKeyList[0])
      const proof = getProof(identity, proofAddress, privateKey!)

      const addAttrParams: BulkAttributeParam[] = []
      bulkAttrParams.forEach(item => {
        addAttrParams.push({
          name: <string>item.name,
          value: <string>item.value,
          proof,
          validity: item.validity
        })
      })

      const result = await vdaDid.bulkAdd(
        addDelegateParams,
        addAttrParams
      )
      expect(result.success).toEqual(true)
    })

    it("bulkRevoke test",async () => {
      const addDelegateParams: BulkDelegateParam[] = []
      bulkDelegateParams.forEach(item => 
        addDelegateParams.push({
          delegate: item.delegate,
          delegateType: getDelegateType(<string>item.delegateType),
        })
      )
  
      const addAttrParams: BulkAttributeParam[] = []
      bulkAttrParams.forEach(item => {
        addAttrParams.push({
          name: <string>item.name,
          value: <string>item.value,
        })
      })
  
      const result = await vdaDid.bulkRevoke(
        addDelegateParams,
        addAttrParams
      )
      expect(result.success).toEqual(true)
    })
  })

  describe ('crete a complete DIDDocument', () => {
    it ('add delegates',async () => {
      await vdaDid.addDelegate(
        delegates[0].delegate,
        getDelegateType(<string>delegates[0].delegateType),
        delegates[0].validity
      )
    })

    it('add attributes',async () => {
      for (let i = 0; i < 3; i++) {
        const proofAddress = ethers.utils.computeAddress(pubKeyList[i])
        const proof = getProof(identity, proofAddress, privateKey!)
        if (i < 2) {
          // set attribute with proof
          await vdaDid.setAttribute(
            <string>attributes[i].name,
            <string>attributes[i].value,
            proof
          )
        } else {
          // set attribute without proof
          await vdaDid.setAttribute(
            <string>attributes[i].name,
            <string>attributes[i].value,
          )
        }
      }
    })

    it('add services',async () => {
      const keyList = [
        'did/svc/VeridaMessage',
        'did/svc/VeridaDatabase',
      ]
      const typeList = [
        'message',
        'database'
      ]
      const contextList = [
        '0x84e5fb4eb5c3f53d8506e7085dfbb0ef333c5f7d0769bcaf4ca2dc0ca4698fd4',
        '0xcfbf4621af64386c92c0badd0aa3ae3877a6ea6e298dfa54aa6b1ebe00769b28'
      ]
  
      const serviceEndPoint = 'https://db.testnet.verida.io:5002'

      for (let i = 0; i < keyList.length; i++) {
        const paramVale = `${serviceEndPoint}?context=${contextList[i]}&type=${typeList[i]}`
        await vdaDid.setAttribute(
          keyList[i],
          paramVale
        )
      }
    })

    it('resolve document',async () => {
      doc = await didResolver.resolve(vdaDid.did)
      console.log('Entire Document : ', doc.didDocument);

      console.log("verificationMethod : ", doc.didDocument.verificationMethod)
      console.log("AssertionMethod : ", doc.didDocument.assertionMethod)
      console.log("Authentication : ", doc.didDocument.authentication)
      console.log("keyAgreement : ", doc.didDocument.keyAgreement)
      console.log("service : ", doc.didDocument.service)
    })
  })
})