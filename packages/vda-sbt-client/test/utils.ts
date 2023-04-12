import {
  RECIPIENT_WALLET,
  DidInterface,
  getBlockchainAPIConfiguration, 
} from "@verida/vda-common"

import { VeridaSBTClient } from "../src/index"
import { Keyring } from "@verida/keyring";
import { EnvironmentType } from "@verida/types";
import { explodeDID } from "@verida/helpers"
const assert = require('assert')

export const mintedTokenIds = [1, 3]
export const burntTokenIds =  [2, 4]

export const createBlockchainAPI = (did: DidInterface, isWallet = false) => {
  const configuration = getBlockchainAPIConfiguration(did.privateKey);
  return new VeridaSBTClient({
      did: isWallet ? 'did:vda:testnet:' + did.address : did.address,
      signKey: did.privateKey,
      network: EnvironmentType.TESTNET,
      ...configuration
  })
}

export const claimSBT = async (
  did: string,
  sbtType: string,
  uniqueId: string,
  sbtURI: string,
  receiverAddress: string,
  signerContextProof: string,
  signerKeyring: Keyring,
  blockchainApi: VeridaSBTClient
) => {
  const { address: didAddress } = explodeDID(did)

  const signedDataMsg = `${sbtType}-${uniqueId}-${didAddress.toLowerCase()}`
  const signedData = await signerKeyring.sign(signedDataMsg)

  await blockchainApi.claimSBT(
      sbtType,
      uniqueId,
      sbtURI,
      receiverAddress.toLowerCase(),
      signedData,
      signerContextProof
  )
}

export const createTestDataIfNotExist = async (
  did: DidInterface,
  tokenReceiver: DidInterface,
  trustedSigner: DidInterface, 
  blockchainApi: VeridaSBTClient,
  keyring: Keyring,
  signedProof: string
  ) => {
  const orgTotalSupply = parseInt(await blockchainApi.totalSupply())
  if (orgTotalSupply > 0) return;

  console.log("Creating initial test data by mint & burn operations")

  const sbtType = "twitter-test"
  const uniqueIds = ["00001", "00002", "00003", "00004", "00005"]
  const sbtURI = "https://gateway.pinata.cloud/ipfs/QmVrTkbrzNHRhmsh88XnwJo5gBu8WqQMFTkVB4KoVLxSEY/3.json"

  
  // Should check if the trustedSigner is registered to the contract
  const signers = await blockchainApi.getTrustedSignerAddresses()
  const match = trustedSigner.address.match(/0x(.*)/)
  assert.ok(signers.includes(match![0]))

  // Mint tokens
  for (let i = 0; i < uniqueIds.length; i++) {
      await claimSBT(
          did.address, 
          sbtType, 
          uniqueIds[i], 
          sbtURI, 
          tokenReceiver.address.toLowerCase(),
          signedProof, 
          keyring, 
          blockchainApi
      )
  }
  const newTotalSupply = parseInt(await blockchainApi.totalSupply())

  assert.ok(newTotalSupply === 5, "SBT claimed successfully")

  // burn last 2 tokens
  const receiverSBTClient = createBlockchainAPI(RECIPIENT_WALLET, true)
  for (const id of burntTokenIds) {
      await receiverSBTClient.burnSBT(id)
  }

  console.log("Initial test data created")
}
