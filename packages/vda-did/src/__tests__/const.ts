// Common test data to test DIDRegistry
// Shared between library tests
import EncryptionUtils from '@verida/encryption-utils'
import { formatBytes32String, BytesLike } from 'ethers/lib/utils.js'
import * as base64 from '@ethersproject/base64'
import { Base58 } from '@ethersproject/basex'
import { ethers, BigNumberish, Wallet } from 'ethers'

const testAccounts = [
  Wallet.createRandom(),
  Wallet.createRandom(),
  Wallet.createRandom(),
  Wallet.createRandom(),
  Wallet.createRandom(),
]

export const badSigner = testAccounts[4]
export const zeroAddress = '0x0000000000000000000000000000000000000000'

export const getVeridaSign = (rawMsg: any, privateKey: string) => {
  const privateKeyArray = new Uint8Array(Buffer.from(privateKey.slice(2), 'hex'))
  return EncryptionUtils.signData(rawMsg, privateKeyArray)
}

export const getVeridaSignWithNonce = (rawMsg: any, privateKey: string, nonce: number) => {
  rawMsg = ethers.utils.solidityPack(['bytes', 'uint256'], [rawMsg, nonce])
  return getVeridaSign(rawMsg, privateKey)
}

// Delegate Test Data
export const delegates: DelegateType[] = [
  {
    delegateType: formatBytes32String('veriKey'),
    delegate: testAccounts[0].address,
    validity: 86400,
  },

  {
    delegateType: formatBytes32String('veriKey'),
    delegate: testAccounts[1].address,
    validity: 86400,
  },
]

// Attribute Test Data
const keyAlgorithm = ['Secp256k1', 'Rsa', 'Ed25519']

const keyPurpose = ['sigAuth', 'veriKey', 'veriKey']

const encoding = ['hex', 'base64', 'base58']

export const pubKeyList = [testAccounts[0].publicKey, testAccounts[1].publicKey, testAccounts[2].publicKey]

const contextList = [testAccounts[1].publicKey, testAccounts[2].publicKey, testAccounts[3].publicKey]

function generateAttributes() {
  const attributes: AttributeType[] = []
  for (let i = 0; i < 3; i++) {
    let pubKey = pubKeyList[i]
    if (encoding[i] === 'base64') {
      pubKey = base64.encode(pubKey)
    } else if (encoding[i] === 'base58') {
      pubKey = Base58.encode(pubKey)
    }
    attributes.push({
      name: `did/pub/${keyAlgorithm[i]}/${keyPurpose[i]}/${encoding[i]}`,
      value: `${pubKey}?context=${contextList[i]}`,
      validity: 86400,
    })
  }
  return attributes
}

export const attributes: AttributeType[] = generateAttributes()

// Type for bulk transaction
export type DelegateType = {
  delegateType: BytesLike
  delegate: string
  validity?: number
}

export type AttributeType = {
  name: BytesLike
  value: BytesLike
  validity?: number
  proof?: BytesLike
}
