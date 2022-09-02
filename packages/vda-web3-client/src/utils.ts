/* eslint-disable prettier/prettier */
import { hexlify, hexValue, isBytes } from '@ethersproject/bytes'
import * as base64 from '@ethersproject/base64'
import { Base58 } from '@ethersproject/basex'
import { toUtf8Bytes } from '@ethersproject/strings'

import { veridaContractWhiteList } from './constants'

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
  return veridaContractWhiteList.includes(contractAddress.toLowerCase())
}
