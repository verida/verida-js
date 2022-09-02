import { createJWT, ES256KSigner, JWTVerified, Signer as JWTSigner, verifyJWT } from 'did-jwt'
import { Signer as TxSigner } from '@ethersproject/abstract-signer'
import { CallOverrides } from '@ethersproject/contracts'
import { computeAddress } from '@ethersproject/transactions'
import { computePublicKey } from '@ethersproject/signing-key'
import { Provider } from '@ethersproject/providers'
import { Wallet } from '@ethersproject/wallet'
import { hexValue } from '@ethersproject/bytes'
import { interpretIdentifier, REGISTRY, VdaDidController } from '@verida/vda-did-resolver'
import { Resolvable } from 'did-resolver'

import { CallType, VdaTransactionResult, VeridaWeb3ConfigurationOption } from '@verida/vda-did-resolver'

import { attributeToHex } from './helpers'

export { VdaTransactionResult }

export enum DelegateTypes {
  veriKey = 'veriKey',
  sigAuth = 'sigAuth',
  enc = 'enc',
}

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

/**
 * Interface for VDA-DID instance creation
 * @param identifier: DID
 * @param vdaKey: private key of DID. Used to generate signature in transactions to chains
 * @param chainNameOrId: Target chain name or chain id.
 * @param callType : VDA-DID run mode. Values from vda-did-resolver
 * @param web3Options: Web3 configuration depending on call type. Values from vda-did-resolver
 */
interface IConfig {
  identifier: string
  vdaKey: string
  chainNameOrId?: string | number

  callType: CallType
  web3Options: VeridaWeb3ConfigurationOption

  // txSigner?: TxSigner
  // privateKey?: string

  // provider?: Provider
  // // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // web3?: any
}

export type KeyPair = {
  address: string
  privateKey: string
  publicKey: string
  identifier: string
}

export type BulkDelegateParam = {
  delegateType?: DelegateTypes
  delegate: string
  validity?: number
}

export type BulkAttributeParam = {
  name: string
  value: string | Uint8Array
  proof?: string
  validity?: number
}

/** A class that interacts with VdaDIDRegistry contract */
export class VdaDID {
  public did: string
  private signKey: string
  public address: string
  public signer?: JWTSigner
  public alg?: 'ES256K' | 'ES256K-R'
  private owner?: string
  private controller?: VdaDidController

  /** Create a VdaDID instance */
  constructor(conf: IConfig) {
    const { address, publicKey, network } = interpretIdentifier(conf.identifier)

    this.controller = new VdaDidController(conf.callType, conf.web3Options, conf.identifier, conf.chainNameOrId)
    this.did = this.controller.did
    this.signKey = conf.vdaKey

    this.address = address
    // if (conf.signer) {
    //   this.signer = conf.signer
    //   this.alg = conf.alg
    //   if (!this.alg) {
    //     console.warn(
    //       'A JWT signer was specified but no algorithm was set. Please set the `alg` parameter when calling `new EthrDID()`'
    //     )
    //   }
    // } else if (conf.privateKey) {
    //   this.signer = ES256KSigner(conf.privateKey, true)
    //   this.alg = 'ES256K-R'
    // }
  }

  /** Create a Wallet that will be used to sign transactions */
  static createKeyPair(chainNameOrId?: string | number): KeyPair {
    const wallet = Wallet.createRandom()
    const privateKey = wallet.privateKey
    const address = computeAddress(privateKey)
    const publicKey = computePublicKey(privateKey, true)
    const net = typeof chainNameOrId === 'number' ? hexValue(chainNameOrId) : chainNameOrId
    const identifier = net ? `did:ethr:${net}:${publicKey}` : publicKey
    return { address, privateKey, publicKey, identifier }
  }

  /** Get a owner of a DID */
  async lookupOwner(cache = true): Promise<string> {
    return new Promise((resolve, reject) => {
      if (typeof this.controller === 'undefined') {
        reject('a web3 provider configuration is needed for network operations')
      }
      if (cache && this.owner) {
        resolve(this.owner)
      }
      resolve(this.controller!.getOwner(this.address))
    })
  }

  /** Change the owner of DID */
  async changeOwner(newOwner: string, txOptions?: CallOverrides): Promise<VdaTransactionResult> {
    if (typeof this.controller === 'undefined') {
      return Promise.reject('a web3 provider configuration is needed for network operations')
    }

    this.owner = newOwner

    // const owner = await this.lookupOwner()
    return this.controller.changeOwner(newOwner, this.signKey, {
      ...txOptions,
      // from: owner,
    })
  }

  /** Add a delegate */
  async addDelegate(
    delegate: string,
    delegateType = DelegateTypes.veriKey,
    expiresIn = 86400,
    txOptions: CallOverrides = {}
  ): Promise<VdaTransactionResult> {
    if (typeof this.controller === 'undefined') {
      return Promise.reject('a web3 provider configuration is needed for network operations')
    }

    // const owner = await this.lookupOwner()
    return this.controller.addDelegate(delegateType, delegate, expiresIn, this.signKey, {
      ...txOptions /*, from: owner*/,
    })
  }

  /** Revoke a delegate */
  async revokeDelegate(
    delegate: string,
    delegateType = DelegateTypes.veriKey,
    txOptions: CallOverrides = {}
  ): Promise<VdaTransactionResult> {
    if (typeof this.controller === 'undefined') {
      return Promise.reject('a web3 provider configuration is needed for network operations')
    }
    // const owner = await this.lookupOwner()
    return this.controller.revokeDelegate(delegateType, delegate, this.signKey, { ...txOptions /*, from: owner*/ })
  }

  /** Set an attribute. */
  async setAttribute(
    key: string,
    value: string | Uint8Array,
    proof = '',
    expiresIn = 86400,
    /** @deprecated, please use txOptions.gasLimit */
    gasLimit?: number,
    txOptions: CallOverrides = {}
  ): Promise<VdaTransactionResult> {
    if (typeof this.controller === 'undefined') {
      return Promise.reject('a web3 provider configuration is needed for network operations')
    }
    // const owner = await this.lookupOwner()

    // console.log('vda-did setAttribute key: ', key)
    // console.log('vda-did setAttribute value: ', value)
    // console.log('vda-did setAttribute : ', attributeToHex(key, value))

    return this.controller.setAttribute(key, attributeToHex(key, value), expiresIn, proof, this.signKey, {
      gasLimit,
      ...txOptions,
      // from: owner,
    })
  }

  /** Revoke an attribute */
  async revokeAttribute(
    key: string,
    value: string | Uint8Array,
    /** @deprecated please use `txOptions.gasLimit` */
    gasLimit?: number,
    txOptions: CallOverrides = {}
  ): Promise<VdaTransactionResult> {
    if (typeof this.controller === 'undefined') {
      return Promise.reject('a web3 provider configuration is needed for network operations')
    }
    // const owner = await this.lookupOwner()
    return this.controller.revokeAttribute(key, attributeToHex(key, value), this.signKey, {
      gasLimit,
      ...txOptions,
      // from: owner,
    })
  }

  // async nonce(signer: string, gasLimit?: number, txOptions: CallOverrides = {}): Promise<BigInt> {
  //   if (typeof this.controller === 'undefined') {
  //     throw new Error('a web3 provider configuration is needed for network operations')
  //   }
  //   const owner = await this.lookupOwner()
  //   const receipt = await this.controller.nonce(signer, {
  //     gasLimit,
  //     ...txOptions,
  //     from: owner,
  //   })
  //   // console.log('Ethr-DID : Nonce = ', receipt)
  //   return receipt.toBigInt()
  // }

  /** Perform bulk transaction for add delegates & attributes */
  async bulkAdd(
    delegateParams: BulkDelegateParam[],
    attributeParams: BulkAttributeParam[],
    /** @deprecated, please use txOptions.gasLimit */
    gasLimit?: number,
    txOptions: CallOverrides = {}
  ): Promise<VdaTransactionResult> {
    if (typeof this.controller === 'undefined') {
      return Promise.reject('a web3 provider configuration is needed for network operations')
    }

    const controllerDParams = delegateParams.map((item) => {
      return {
        delegateType: item.delegateType ?? DelegateTypes.veriKey,
        delegate: item.delegate,
        validity: item.validity ?? 86400,
      }
    })

    const controllerAParams = attributeParams.map((item) => {
      return {
        ...item,
        value: attributeToHex(item.name, item.value),
        proof: item.proof || '',
        validity: item.validity ?? 86400,
      }
    })

    // const owner = await this.lookupOwner()
    return this.controller.bulkAdd(controllerDParams, controllerAParams, this.signKey, {
      ...txOptions /*, from: owner*/,
    })
  }

  /** Perform a bulk transaction for removing delegates & attributes */
  async bulkRevoke(
    delegateParams: BulkDelegateParam[],
    attributeParams: BulkAttributeParam[],
    /** @deprecated, please use txOptions.gasLimit */
    gasLimit?: number,
    txOptions: CallOverrides = {}
  ): Promise<VdaTransactionResult> {
    if (typeof this.controller === 'undefined') {
      return Promise.reject('a web3 provider configuration is needed for network operations')
    }

    const controllerDParams = delegateParams.map((item) => {
      return {
        delegateType: item.delegateType ?? DelegateTypes.veriKey,
        delegate: item.delegate,
      }
    })

    const controllerAParams = attributeParams.map((item) => {
      return {
        name: item.name,
        value: attributeToHex(item.name, item.value),
      }
    })

    // const owner = await this.lookupOwner()
    return this.controller.bulkRevoke(controllerDParams, controllerAParams, this.signKey, {
      ...txOptions,
      // from: owner,
    })
  }
}
