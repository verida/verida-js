/* eslint-disable prettier/prettier */
import { hexlify, hexValue, isBytes } from '@ethersproject/bytes'
import * as base64 from '@ethersproject/base64'
import { Base58 } from '@ethersproject/basex'
import { toUtf8Bytes } from '@ethersproject/strings'

import { veridaContractWhiteList } from './constants'

/**
 * Convert string to hex format. Used in DIDRegistryContract interaction
 * @param key - Attribute key
 * @param value - Attribute value
 * @returns {string} string value in hex format
 */
export function attributeToHex(key: string, value: string | Uint8Array): string {
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

/**
 * Convert string to 32Bytes value
 * @param str Input string
 * @returns {string} 32bytes value
 */
export function stringToBytes32(str: string): string {
  const buffStr = '0x' + Buffer.from(str).slice(0, 32).toString('hex')
  return buffStr + '0'.repeat(66 - buffStr.length)
}

/**
 * Check contract address is Verida contract
 * @param contractAddress - Input contract address
 * @returns {boolean} - true if verida contract
 */
export function isVeridaContract(contractAddress: string) : boolean {
  return veridaContractWhiteList.includes(contractAddress)
}
