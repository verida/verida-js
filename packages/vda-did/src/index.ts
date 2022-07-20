import { createJWT, ES256KSigner, JWTVerified, Signer as JWTSigner, verifyJWT } from 'did-jwt'
import { Signer as TxSigner } from '@ethersproject/abstract-signer'
import { CallOverrides } from '@ethersproject/contracts'
import { computeAddress } from '@ethersproject/transactions'
import { computePublicKey } from '@ethersproject/signing-key'
import { Provider } from '@ethersproject/providers'
import { Wallet } from '@ethersproject/wallet'
import * as base64 from '@ethersproject/base64'
import { hexlify, hexValue, isBytes } from '@ethersproject/bytes'
import { Base58 } from '@ethersproject/basex'
import { toUtf8Bytes } from '@ethersproject/strings'
import { interpretIdentifier, REGISTRY, VdaDidController } from '@verida/vda-did-resolver'
import { Resolvable } from 'did-resolver'

import { CallType, VeridaWeb3ConfigurationOption } from '@verida/vda-did-resolver'

export enum DelegateTypes {
  veriKey = 'veriKey',
  sigAuth = 'sigAuth',
  enc = 'enc',
}

interface IConfig {
  identifier: string
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

type DelegateOptions = {
  delegateType?: DelegateTypes
  expiresIn?: number
}

export type BulkDelegateParam = {
  delegateType?: DelegateTypes
  delegate: string
  validity?: number
}

export type BulkAttributeParam = {
  name: string
  value: string | Uint8Array
  validity?: number
}

export class VdaDID {
  public did: string
  public address: string
  public signer?: JWTSigner
  public alg?: 'ES256K' | 'ES256K-R'
  private owner?: string
  private controller?: VdaDidController

  constructor(conf: IConfig) {
    const { address, publicKey, network } = interpretIdentifier(conf.identifier)

    this.controller = new VdaDidController(conf.callType, conf.web3Options, conf.identifier, conf.chainNameOrId)
    this.did = this.controller.did

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

  static createKeyPair(chainNameOrId?: string | number): KeyPair {
    const wallet = Wallet.createRandom()
    const privateKey = wallet.privateKey
    const address = computeAddress(privateKey)
    const publicKey = computePublicKey(privateKey, true)
    const net = typeof chainNameOrId === 'number' ? hexValue(chainNameOrId) : chainNameOrId
    const identifier = net ? `did:ethr:${net}:${publicKey}` : publicKey
    return { address, privateKey, publicKey, identifier }
  }

  async lookupOwner(cache = true): Promise<string> {
    if (typeof this.controller === 'undefined') {
      throw new Error('a web3 provider configuration is needed for network operations')
    }
    if (cache && this.owner) return this.owner
    return this.controller?.getOwner(this.address)
  }

  async changeOwner(newOwner: string, txOptions?: CallOverrides): Promise<string> {
    if (typeof this.controller === 'undefined') {
      throw new Error('a web3 provider configuration is needed for network operations')
    }
    const owner = await this.lookupOwner()

    // console.log('ethr-did controller = ', this.controller)

    // console.log('txOptions = ', txOptions)

    const receipt = await this.controller.changeOwner(newOwner, {
      ...txOptions,
      from: owner,
    })
    // console.log('txResult = ', receipt)

    this.owner = newOwner
    return receipt.data
  }

  async addDelegate(
    delegate: string,
    delegateOptions?: DelegateOptions,
    txOptions: CallOverrides = {}
  ): Promise<string> {
    if (typeof this.controller === 'undefined') {
      throw new Error('a web3 provider configuration is needed for network operations')
    }
    const owner = await this.lookupOwner()
    const receipt = await this.controller.addDelegate(
      delegateOptions?.delegateType || DelegateTypes.veriKey,
      delegate,
      delegateOptions?.expiresIn || 86400,
      { ...txOptions, from: owner }
    )
    return receipt.data
  }

  async revokeDelegate(
    delegate: string,
    delegateType = DelegateTypes.veriKey,
    txOptions: CallOverrides = {}
  ): Promise<string> {
    if (typeof this.controller === 'undefined') {
      throw new Error('a web3 provider configuration is needed for network operations')
    }
    const owner = await this.lookupOwner()
    const receipt = await this.controller.revokeDelegate(delegateType, delegate, { ...txOptions, from: owner })
    return receipt.data
  }

  async setAttribute(
    key: string,
    value: string | Uint8Array,
    expiresIn = 86400,
    /** @deprecated, please use txOptions.gasLimit */
    gasLimit?: number,
    txOptions: CallOverrides = {}
  ): Promise<string> {
    if (typeof this.controller === 'undefined') {
      throw new Error('a web3 provider configuration is needed for network operations')
    }
    const owner = await this.lookupOwner()
    const receipt = await this.controller.setAttribute(key, attributeToHex(key, value), expiresIn, {
      gasLimit,
      ...txOptions,
      from: owner,
    })
    return receipt.data
  }

  async revokeAttribute(
    key: string,
    value: string | Uint8Array,
    /** @deprecated please use `txOptions.gasLimit` */
    gasLimit?: number,
    txOptions: CallOverrides = {}
  ): Promise<string> {
    if (typeof this.controller === 'undefined') {
      throw new Error('a web3 provider configuration is needed for network operations')
    }
    const owner = await this.lookupOwner()
    const receipt = await this.controller.revokeAttribute(key, attributeToHex(key, value), {
      gasLimit,
      ...txOptions,
      from: owner,
    })
    return receipt.data
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

  // Newly Added
  async bulkAdd(
    delegateParams: BulkDelegateParam[],
    attributeParams: BulkAttributeParam[],
    /** @deprecated, please use txOptions.gasLimit */
    gasLimit?: number,
    txOptions: CallOverrides = {}
  ): Promise<string> {
    if (typeof this.controller === 'undefined') {
      throw new Error('a web3 provider configuration is needed for network operations')
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
        name: item.name,
        value: attributeToHex(item.name, item.value),
        validity: item.validity ?? 86400,
      }
    })

    const owner = await this.lookupOwner()
    const receipt = await this.controller.bulkAdd(controllerDParams, controllerAParams, { ...txOptions, from: owner })
    return receipt.data
  }

  async bulkRevoke(
    delegateParams: BulkDelegateParam[],
    attributeParams: BulkAttributeParam[],
    /** @deprecated, please use txOptions.gasLimit */
    gasLimit?: number,
    txOptions: CallOverrides = {}
  ): Promise<string> {
    if (typeof this.controller === 'undefined') {
      throw new Error('a web3 provider configuration is needed for network operations')
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

    const owner = await this.lookupOwner()
    const receipt = await this.controller.bulkRevoke(controllerDParams, controllerAParams, {
      ...txOptions,
      from: owner,
    })
    return receipt.data
  }
}

function attributeToHex(key: string, value: string | Uint8Array): string {
  if (value instanceof Uint8Array || isBytes(value)) {
    return hexlify(value)
  }
  const matchKeyWithEncoding = key.match(/^did\/(pub|auth|svc)\/(\w+)(\/(\w+))?(\/(\w+))?$/)

  // Added for service name. Need to be updated for supporting UTF-8, later
  // if (matchKeyWithEncoding?.[1] === 'svc') {
  //   console.log('ethr-did: attributeToHex : ', <string>value)
  //   return <string>value
  // }

  const encoding = matchKeyWithEncoding?.[6]
  const matchHexString = (<string>value).match(/^0x[0-9a-fA-F]*$/)
  if (encoding && !matchHexString) {
    if (encoding === 'base64') {
      return hexlify(base64.decode(value))
    }
    if (encoding === 'base58') {
      return hexlify(Base58.decode(value))
    }
  } else if (matchHexString) {
    return <string>value
  }

  return hexlify(toUtf8Bytes(value))
}
