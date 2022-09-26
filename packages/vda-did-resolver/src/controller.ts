import { Signer } from '@ethersproject/abstract-signer'
// import { isAddress } from '@ethersproject/address'
import { BigNumber } from '@ethersproject/bignumber'
import { CallOverrides, Contract } from '@ethersproject/contracts'
import { BlockTag, JsonRpcProvider, Provider, TransactionReceipt } from '@ethersproject/providers'
// import { getContractForNetwork } from './configuration'
import { getContractInfoForNetwork } from './configuration'
import { address, interpretIdentifier, stringToBytes32 } from './helpers'

import { CallType, ContractInfo, VeridaSelfTransactionConfig, VeridaMetaTransactionConfig } from '@verida/web3'
import { getVeridaContract, VeridaContract, VdaTransactionResult } from '@verida/web3'
import { VeridaWeb3ConfigurationOption } from './configuration'
import { ethers } from 'ethers'

import EncryptionUtils from '@verida/encryption-utils'

/**
 * A class that can be used to interact with the ERC1056 contract on behalf of a local controller key-pair
 */
export class VdaDidController {
  private address: string // public address of did - 0x324...2321
  public did: string // DID - did:vda:kovan:0x324...2321

  private didContract: VeridaContract

  /**
   * Creates an VdaDidController instance.
   * @param callType : Verida Web3 interaction mode : direct/gasless
   * @param options : Verdia Web3 Configuration
   * @param identifier - required - a `did:vda` string or a publicKeyHex or an ethereum address
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
    // console.log('VdaDIDController ContractInfo : ', contractInfo)

    this.didContract = getVeridaContract(callType, {
      ...contractInfo,
      ...options,
    })

    this.address = address
    let networkString = net ? `${net}:` : ''
    if (networkString in ['mainnet:', '0x89:']) {
      networkString = ''
    }
    this.did = publicKey ? `did:vda:${networkString}${publicKey}` : `did:vda:${networkString}${address}`
  }

  private getVeridaSignature = async (rawMsg: string, privateKey: string) => {
    const nonce = (await this.didContract.getNonce(this.address)).data //.toNumber()
    rawMsg = ethers.utils.solidityPack(['bytes', 'uint256'], [rawMsg, nonce])

    const privateKeyArray = new Uint8Array(Buffer.from(privateKey.slice(2), 'hex'))

    return EncryptionUtils.signData(rawMsg, privateKeyArray)
  }

  /**
   * Get owner of a DID
   * @param address DID
   * @param blockTag Optional - Search point. Will be used in next update
   * @returns Owner address of DID
   */
  async getOwner(address: address, blockTag?: BlockTag): Promise<string> {
    const owner = await this.didContract.identityOwner(address)
    return new Promise((resolve, reject) => {
      if (!owner.data) {
        reject('Error in transaction')
      }
      resolve(owner.data)
    })
  }

  /**
   * Change owner of a DID
   *
   * @param newOwner new owenr address
   * @param signKey Verida account private key starting with 0x.
   * @param options Transaction overrides - Not used now. Will be used from next update
   * @returns Object that shows the status & transactionRecipient or status & err message
   */
  async changeOwner(newOwner: address, signKey: string, options: CallOverrides = {}): Promise<VdaTransactionResult> {
    const rawMsg = ethers.utils.solidityPack(['address', 'address'], [this.address, newOwner])
    const signature = await this.getVeridaSignature(rawMsg, signKey)
    return Promise.resolve(this.didContract.changeOwner(this.address, newOwner, signature))
  }

  /**
   * Add a delegate
   * @param delegateType Type of delegate
   * @param delegateAddress Delegate address
   * @param exp Validity duration
   * @param options Optional - Not used now. Transaction overrides
   * @returns Object that shows the status & transactionRecipient or status & err message
   */
  async addDelegate(
    delegateType: string,
    delegateAddress: address,
    exp: number,
    signKey: string,
    options: CallOverrides = {}
  ): Promise<VdaTransactionResult> {
    const delegateTypeBytes = stringToBytes32(delegateType)

    const rawMsg = ethers.utils.solidityPack(
      ['address', 'bytes32', 'address', 'uint'],
      [this.address, delegateTypeBytes, delegateAddress, exp]
    )
    const signature = await this.getVeridaSignature(rawMsg, signKey)

    return Promise.resolve(
      this.didContract.addDelegate(this.address, delegateTypeBytes, delegateAddress, exp, signature)
    )
  }

  /**
   * Revoke a delegate
   * @param delegateType Type of delegate
   * @param delegateAddress Delegate address
   * @param options Optional - Not used now. Transaction overrides
   * @returns Object that shows the status & transactionRecipient or status & err message
   */
  async revokeDelegate(
    delegateType: string,
    delegateAddress: address,
    signKey: string,
    options: CallOverrides = {}
  ): Promise<VdaTransactionResult> {
    delegateType = delegateType.startsWith('0x') ? delegateType : stringToBytes32(delegateType)
    const rawMsg = ethers.utils.solidityPack(
      ['address', 'bytes32', 'address'],
      [this.address, delegateType, delegateAddress]
    )
    const signature = await this.getVeridaSignature(rawMsg, signKey)

    return Promise.resolve(this.didContract.revokeDelegate(this.address, delegateType, delegateAddress, signature))
  }

  /**
   * Set an attribute
   * @param attrName Attribute name
   * @param attrValue Attribute value.
   * @param exp Validity duration
   * @param proof An optional proof signed by the DID controller that proves the DID controls the public key being set as an attribute. See https://github.com/verida/blockchain-contracts/issues/40 (verifyRequest) for more details.
   * @param signKey Private key for the DID controller, used on chain to verify this request originated from the DID controller
   * @param options Optional - Not used now. Transaction overrides
   * @returns Object that shows the status & transactionRecipient or status & err message
   */
  async setAttribute(
    attrName: string,
    attrValue: string,
    exp: number,
    proof: string,
    signKey: string,
    options: CallOverrides = {}
  ): Promise<VdaTransactionResult> {
    attrName = attrName.startsWith('0x') ? attrName : stringToBytes32(attrName)
    attrValue = attrValue.startsWith('0x') ? attrValue : '0x' + Buffer.from(attrValue, 'utf-8').toString('hex')

    const attrProof = proof.length !== 0 ? proof : []
    const rawMsg = ethers.utils.solidityPack(
      ['address', 'bytes32', 'bytes', 'uint', 'bytes'],
      [this.address, attrName, attrValue, exp, attrProof]
    )
    const signature = await this.getVeridaSignature(rawMsg, signKey)

    return Promise.resolve(this.didContract.setAttribute(this.address, attrName, attrValue, exp, attrProof, signature))
  }

  /**
   * Revoke an attribute
   * @param attrName Attribute name
   * @param attrValue Attribute value.
   * @param signKey Private key for the DID controller, used on chain to verify this request originated from the DID controller
   * @param options Optional - Not used now. Transaction overrides
   * @returns Object that shows the status & transactionRecipient or status & err message
   */
  async revokeAttribute(
    attrName: string,
    attrValue: string,
    signKey: string,
    options: CallOverrides = {}
  ): Promise<VdaTransactionResult> {
    // console.log(`revoking attribute ${attrName}(${attrValue}) for ${identity}`)
    attrName = attrName.startsWith('0x') ? attrName : stringToBytes32(attrName)
    attrValue = attrValue.startsWith('0x') ? attrValue : '0x' + Buffer.from(attrValue, 'utf-8').toString('hex')

    const rawMsg = ethers.utils.solidityPack(['address', 'bytes32', 'bytes'], [this.address, attrName, attrValue])
    const signature = await this.getVeridaSignature(rawMsg, signKey)

    return Promise.resolve(this.didContract.revokeAttribute(this.address, attrName, attrValue, signature))
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

  /**
   * Perform bulk transaction to add delegateList & attributeList
   * @param delegateParams delegate list to be added
   * @param attributeParams attribute list to be added
   * @param signKey Private key for the DID controller, used on chain to verify this request originated from the DID controller
   * @param options Optional - Not used now. Transaction overrides
   * @returns Object that shows the status & transactionRecipient or status & err message
   */
  async bulkAdd(
    delegateParams: { delegateType: string; delegate: address; validity: number }[],
    attributeParams: { name: string; value: string; validity: number; proof: string }[],
    signKey: string,
    options: CallOverrides = {}
  ): Promise<VdaTransactionResult> {
    let rawMsg = ethers.utils.solidityPack(['address'], [this.address])
    const dParams = delegateParams.map((item) => {
      rawMsg = ethers.utils.solidityPack(
        ['bytes', 'bytes32', 'address', 'uint'],
        [rawMsg, stringToBytes32(item.delegateType), item.delegate, item.validity]
      )
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

      const attrProof = item.proof.length !== 0 ? item.proof : []

      rawMsg = ethers.utils.solidityPack(
        ['bytes', 'bytes32', 'bytes', 'uint', 'bytes'],
        [rawMsg, attrName, attrValue, item.validity, attrProof]
      )
      return {
        name: attrName,
        value: attrValue,
        validity: item.validity,
        proof: attrProof,
      }
    })

    const signature = await this.getVeridaSignature(rawMsg, signKey)

    return Promise.resolve(this.didContract.bulkAdd(this.address, dParams, aParams, signature))
  }

  /**
   * Perform bulk transaction to revoke delegateList & attributeList
   * @param delegateParams delegate list to be added
   * @param attributeParams attribute list to be added
   * @param signKey Private key for the DID controller, used on chain to verify this request originated from the DID controller
   * @param options Optional - Not used now. Transaction overrides
   * @returns Object that shows the status & transactionRecipient or status & err message
   */
  async bulkRevoke(
    delegateParams: { delegateType: string; delegate: address }[],
    attributeParams: { name: string; value: string }[],
    signKey: string,
    options: CallOverrides = {}
  ): Promise<VdaTransactionResult> {
    let rawMsg = ethers.utils.solidityPack(['address'], [this.address])
    const dParams = delegateParams.map((item) => {
      const delegateType = item.delegateType.startsWith('0x') ? item.delegateType : stringToBytes32(item.delegateType)
      rawMsg = ethers.utils.solidityPack(['bytes', 'bytes32', 'address'], [rawMsg, delegateType, item.delegate])
      return {
        ...item,
        delegateType,
      }
    })

    const aParams = attributeParams.map((item) => {
      const attrName = item.name.startsWith('0x') ? item.name : stringToBytes32(item.name)
      const attrValue = item.value.startsWith('0x')
        ? item.value
        : '0x' + Buffer.from(item.value, 'utf-8').toString('hex')
      rawMsg = ethers.utils.solidityPack(['bytes', 'bytes32', 'bytes'], [rawMsg, attrName, attrValue])
      return {
        name: attrName,
        value: attrValue,
      }
    })

    const signature = await this.getVeridaSignature(rawMsg, signKey)

    return Promise.resolve(this.didContract.bulkRevoke(this.address, dParams, aParams, signature))
  }
}
