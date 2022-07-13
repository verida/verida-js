import { getAddress } from '@ethersproject/address'
import { BigNumber } from '@ethersproject/bignumber'
import { computeAddress } from '@ethersproject/transactions'
import { VerificationMethod } from 'did-resolver'

export const identifierMatcher = /^(.*)?(0x[0-9a-fA-F]{40}|0x[0-9a-fA-F]{66})$/
export const nullAddress = '0x0000000000000000000000000000000000000000'
export const DEFAULT_REGISTRY_ADDRESS = '0xdca7ef03e98e0dc2b855be647c39abe984fcf21b'
export const DEFAULT_JSON_RPC = 'http://127.0.0.1:8545/'

export type address = string
export type uint256 = BigNumber
export type bytes32 = string
export type bytes = string

export interface ERC1056Event {
  identity: address
  previousChange: uint256
  validTo?: uint256
  _eventName: string
  blockNumber: number
}

export interface DIDOwnerChanged extends ERC1056Event {
  owner: address
}

export interface DIDAttributeChanged extends ERC1056Event {
  name: bytes32
  value: bytes
  validTo: uint256
}

export interface DIDDelegateChanged extends ERC1056Event {
  delegateType: bytes32
  delegate: address
  validTo: uint256
}

export enum verificationMethodTypes {
  EcdsaSecp256k1VerificationKey2019 = 'EcdsaSecp256k1VerificationKey2019',
  EcdsaSecp256k1RecoveryMethod2020 = 'EcdsaSecp256k1RecoveryMethod2020',
  Ed25519VerificationKey2018 = 'Ed25519VerificationKey2018',
  RSAVerificationKey2018 = 'RSAVerificationKey2018',
  X25519KeyAgreementKey2019 = 'X25519KeyAgreementKey2019',
}

export enum eventNames {
  DIDOwnerChanged = 'DIDOwnerChanged',
  DIDAttributeChanged = 'DIDAttributeChanged',
  DIDDelegateChanged = 'DIDDelegateChanged',
}

export interface LegacyVerificationMethod extends VerificationMethod {
  /**@deprecated */
  publicKeyHex?: string
  /**@deprecated */
  publicKeyBase64?: string
  /**@deprecated */
  publicKeyPem?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [x: string]: any
}

export const legacyAttrTypes: Record<string, string> = {
  sigAuth: 'SignatureAuthentication2018',
  veriKey: 'VerificationKey2018',
  enc: 'KeyAgreementKey2019',
}

export const legacyAlgoMap: Record<string, string> = {
  /**@deprecated */
  Secp256k1VerificationKey2018: verificationMethodTypes.EcdsaSecp256k1VerificationKey2019,
  /**@deprecated */
  Ed25519SignatureAuthentication2018: verificationMethodTypes.Ed25519VerificationKey2018,
  /**@deprecated */
  Secp256k1SignatureAuthentication2018: verificationMethodTypes.EcdsaSecp256k1VerificationKey2019,
  //keep legacy mapping
  RSAVerificationKey2018: verificationMethodTypes.RSAVerificationKey2018,
  Ed25519VerificationKey2018: verificationMethodTypes.Ed25519VerificationKey2018,
  X25519KeyAgreementKey2019: verificationMethodTypes.X25519KeyAgreementKey2019,
}

export function strip0x(input: string): string {
  return input.startsWith('0x') ? input.slice(2) : input
}

export function bytes32toString(input: bytes32 | Uint8Array): string {
  const buff: Buffer = typeof input === 'string' ? Buffer.from(input.slice(2), 'hex') : Buffer.from(input)
  return buff.toString('utf8').replace(/\0+$/, '')
}

export function stringToBytes32(str: string): string {
  const buffStr = '0x' + Buffer.from(str).slice(0, 32).toString('hex')
  return buffStr + '0'.repeat(66 - buffStr.length)
}

export function interpretIdentifier(identifier: string): { address: string; publicKey?: string; network?: string } {
  let id = identifier
  let network = undefined
  if (id.startsWith('did:ethr')) {
    id = id.split('?')[0]
    const components = id.split(':')
    id = components[components.length - 1]
    if (components.length >= 4) {
      network = components.splice(2, components.length - 3).join(':')
    }
  }
  if (id.length > 42) {
    return { address: computeAddress(id), publicKey: id, network }
  } else {
    return { address: getAddress(id), network } // checksum address
  }
}

export const knownInfuraNetworks: Record<string, string> = {
  mainnet: '0x1',
  ropsten: '0x3',
  rinkeby: '0x4',
  goerli: '0x5',
  kovan: '0x2a',
}

export const knownNetworks: Record<string, string> = {
  ...knownInfuraNetworks,
  rsk: '0x1e',
  'rsk:testnet': '0x1f',
  artis_t1: '0x03c401',
  artis_s1: '0x03c301',
  matic: '0x89',
  maticmum: '0x13881',
}

export enum Errors {
  /**
   * The resolver has failed to construct the DID document.
   * This can be caused by a network issue, a wrong registry address or malformed logs while parsing the registry history.
   * Please inspect the `DIDResolutionMetadata.message` to debug further.
   */
  notFound = 'notFound',

  /**
   * The resolver does not know how to resolve the given DID. Most likely it is not a `did:ethr`.
   */
  invalidDid = 'invalidDid',

  /**
   * The resolver is misconfigured or is being asked to resolve a DID anchored on an unknown network
   */
  unknownNetwork = 'unknownNetwork',
}
