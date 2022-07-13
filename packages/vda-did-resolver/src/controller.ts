import { Signer } from '@ethersproject/abstract-signer'
// import { isAddress } from '@ethersproject/address'
import { BigNumber } from '@ethersproject/bignumber'
import { CallOverrides, Contract } from '@ethersproject/contracts'
import { BlockTag, JsonRpcProvider, Provider, TransactionReceipt } from '@ethersproject/providers'
// import { getContractForNetwork } from './configuration'
import { getContractInfoForNetwork } from './configuration'
import { address, DEFAULT_REGISTRY_ADDRESS, interpretIdentifier, stringToBytes32 } from './helpers'

import { CallType, ContractInfo, VeridaSelfTransactionConfig, VeridaMetaTransactionConfig } from '@verida/web3'
import { VeridaContractInstance, VeridaContract } from '@verida/web3'
import { VeridaWeb3ConfigurationOption } from './configuration'

const testSignature =
  '0x67de2d20880a7d27b71cdcb38817ba95800ca82dff557cedd91b96aacb9062e80b9e0b8cb9614fd61ce364502349e9079c26abaa21890d7bc2f1f6c8ff77f6261c'

/**
 * A class that can be used to interact with the ERC1056 contract on behalf of a local controller key-pair
 */
export class VdaDidController {
  private address: string // public address of did - 0x324...2321
  public did: string // DID - did:ethr:kovan:0x324...2321

  private didContract: any

  /**
   * Creates an VdaDidController instance.
   *
   * @param callType : Verida Web3 interaction mode : direct/gasless
   * @param options : Verdia Web3 Configuration
   * @param identifier - required - a `did:ethr` string or a publicKeyHex or an ethereum address
   * @param chainNameOrId - optional - the network name or chainID, defaults to 'mainnet'
   */
  constructor(
    callType: CallType,
    options: VeridaWeb3ConfigurationOption,
    identifier: string | address,
    chainNameOrId: string | number = 'mainnet'
  ) {
    // initialize identifier
    const { address, publicKey, network } = interpretIdentifier(identifier)
    const net = network || chainNameOrId

    // initialize contract connection
    const contractInfo = getContractInfoForNetwork(net)

    this.didContract = VeridaContractInstance(callType, {
      ...contractInfo,
      ...options,
    })

    this.address = address
    let networkString = net ? `${net}:` : ''
    if (networkString in ['mainnet:', '0x1:']) {
      networkString = ''
    }
    this.did = publicKey ? `did:ethr:${networkString}${publicKey}` : `did:ethr:${networkString}${address}`
  }

  async getOwner(address: address, blockTag?: BlockTag): Promise<string> {
    return (await this.didContract.identityOwner(address)).data
  }

  async changeOwner(newOwner: address, options: CallOverrides = {}): Promise<any> {
    // console.log(`changing owner for ${oldOwner} on registry at ${registryContract.address}`)
    return await this.didContract.changeOwner(this.address, newOwner, testSignature)
  }

  async addDelegate(
    delegateType: string,
    delegateAddress: address,
    exp: number,
    options: CallOverrides = {}
  ): Promise<any> {
    const delegateTypeBytes = stringToBytes32(delegateType)
    return await this.didContract.addDelegate(this.address, delegateTypeBytes, delegateAddress, exp, testSignature)
  }

  async revokeDelegate(delegateType: string, delegateAddress: address, options: CallOverrides = {}): Promise<any> {
    delegateType = delegateType.startsWith('0x') ? delegateType : stringToBytes32(delegateType)
    return await this.didContract.revokeDelegate(this.address, delegateType, delegateAddress, testSignature)
  }

  // async nonce(signer: address, options: CallOverrides = {}): Promise<BigNumber> {
  //   const overrides = {
  //     gasLimit: 10000000,
  //     gasPrice: 50000000000,
  //     ...options,
  //   }
  //   const contract = await this.attachContract(overrides.from)
  //   delete overrides.from
  //   const nonceTx = (await contract.functions.nonce(signer)) as BigNumber
  //   // console.log('Controller: nonce = ', nonceTx)
  //   return nonceTx
  // }

  async bulkAdd(
    delegateParams: { delegateType: string; delegate: address; validity: number }[],
    attributeParams: { name: string; value: string; validity: number }[],
    options: CallOverrides = {}
  ): Promise<any> {
    const dParams = delegateParams.map((item) => {
      return {
        ...item,
        delegateType: stringToBytes32(item.delegateType),
      }
    })

    const aParams = attributeParams.map((item) => {
      const attrName = item.name.startsWith('0x') ? item.name : stringToBytes32(item.name)
      const attrValue = item.value.startsWith('0x')
        ? item.value
        : '0x' + Buffer.from(item.value, 'utf-8').toString('hex')
      return {
        name: attrName,
        value: attrValue,
        validity: item.validity,
      }
    })

    return await this.didContract.bulkAdd(this.address, dParams, aParams, testSignature)
  }

  async bulkRevoke(
    delegateParams: { delegateType: string; delegate: address }[],
    attributeParams: { name: string; value: string }[],
    options: CallOverrides = {}
  ): Promise<any> {
    const dParams = delegateParams.map((item) => {
      return {
        ...item,
        delegateType: item.delegateType.startsWith('0x') ? item.delegateType : stringToBytes32(item.delegateType),
      }
    })

    const aParams = attributeParams.map((item) => {
      const attrName = item.name.startsWith('0x') ? item.name : stringToBytes32(item.name)
      const attrValue = item.value.startsWith('0x')
        ? item.value
        : '0x' + Buffer.from(item.value, 'utf-8').toString('hex')
      return {
        name: attrName,
        value: attrValue,
      }
    })

    return await this.didContract.bulkRevoke(this.address, dParams, aParams, testSignature)
  }

  async setAttribute(attrName: string, attrValue: string, exp: number, options: CallOverrides = {}): Promise<any> {
    attrName = attrName.startsWith('0x') ? attrName : stringToBytes32(attrName)
    attrValue = attrValue.startsWith('0x') ? attrValue : '0x' + Buffer.from(attrValue, 'utf-8').toString('hex')

    return await this.didContract.setAttribute(this.address, attrName, attrValue, exp, testSignature)
  }

  async revokeAttribute(attrName: string, attrValue: string, options: CallOverrides = {}): Promise<any> {
    // console.log(`revoking attribute ${attrName}(${attrValue}) for ${identity}`)
    attrName = attrName.startsWith('0x') ? attrName : stringToBytes32(attrName)
    attrValue = attrValue.startsWith('0x') ? attrValue : '0x' + Buffer.from(attrValue, 'utf-8').toString('hex')
    return await this.didContract.revokeAttribute(this.address, attrName, attrValue, testSignature)
  }
}
