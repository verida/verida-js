import {
    DID_LIST, 
    TRUSTED_SIGNER,
    RECIPIENT_WALLET,
} from "@verida/vda-common-test"

import {
    getNetwork, 
    getSignerInfo
} from "./proof"

import { VeridaSBTClient } from "../src/index"
import { Keyring } from "@verida/keyring";
import {
    mintedTokenIds,
    burntTokenIds,
    createBlockchainAPI,
    claimSBT,
    createTestDataIfNotExist
} from './utils'
require('dotenv').config();
const assert = require('assert')

const CONTEXT_NAME = 'Verida Testing: SBT Context'

const did = DID_LIST[0];
const tokenReceiver = RECIPIENT_WALLET

describe('vda-sbt-client blockchain api', () => {
    let blockchainApi : VeridaSBTClient

    const trustedSigner = TRUSTED_SIGNER
    let keyring: Keyring
    let signerContextProof: string

    before(async function() {
        this.timeout(60*1000)
        blockchainApi = createBlockchainAPI(did);
        [keyring, signerContextProof] = await getSignerInfo(trustedSigner.privateKey, CONTEXT_NAME)

        await createTestDataIfNotExist(did, tokenReceiver, trustedSigner, blockchainApi, keyring, signerContextProof)
    })

    describe("totalSupply", () => {
        it("totalSupply",async () => {
            const totalSupply = parseInt(await blockchainApi.totalSupply());
            assert.ok(totalSupply > 0, "Get total supply")
        })    
    })
    
    describe("tokenURI", function() {
        this.timeout(60*1000)

        let totalSupply : number
        before(async () => {
            totalSupply = parseInt(await blockchainApi.totalSupply());
        })

        it("Should reject for invalid token IDs",async () => {
            await assert.rejects(
                blockchainApi.tokenURI(0)
            )

            await assert.rejects(
                blockchainApi.tokenURI(totalSupply + 1)
            )
        })

        it("Get tokenURI successfully", async () => {
            assert.ok(totalSupply > 0, "TotalSupply should be greater than 0")

            const tokenURI = await blockchainApi.tokenURI(1)
            assert.ok(tokenURI && tokenURI.length > 0)
        })
    })
    
    describe("isLocked", function() {
        this.timeout(60*1000)

        it("Should reject for invalid token IDs",async () => {
            await assert.rejects(
                blockchainApi.isLocked(0)
            )
        })

        it("Should reject for burnt token IDs",async () => {
            for (const tokenId of burntTokenIds) {
                await assert.rejects(
                    blockchainApi.isLocked(tokenId)
                )
            }
        })

        it("Should be locked for all minted tokenIDs",async () => {
            for (const tokenId of mintedTokenIds) {
                const locked = await blockchainApi.isLocked(tokenId)
                assert.equal(locked, true, "Locked correctly")
            }
        })
    })

    describe("getTrustedSignerAddresses", () => {
        it("Get trusted signers successfully", async () => {
            const signers = await blockchainApi.getTrustedSignerAddresses()
            const signerLength = parseInt(signers.length)
            assert.ok(signerLength > 0)
        })
    })

    describe("SBT claim & burn", function() {
        this.timeout(60*1000)

        // SBT info
        const sbtType = "twitter"
        const uniqueId = "-uiniqueId12345"
        const sbtURI = "https://gateway.pinata.cloud/ipfs/QmVrTkbrzNHRhmsh88XnwJo5gBu8WqQMFTkVB4KoVLxSEY/3.json"

        it("Claim a SBT successfully",async () => {
            const trustedSignerNetworkInfo = await getNetwork(trustedSigner.privateKey, CONTEXT_NAME)
            const trustedDid = await trustedSignerNetworkInfo.account.did()
            const trustedSignerDIDDocument = await trustedSignerNetworkInfo.account.getDidClient().get(trustedDid)
            const { address: signerAddress } = trustedSigner
            // Should check if the trustedSigner is registered to the contract
            const signers = await blockchainApi.getTrustedSignerAddresses()
            assert.ok(signers.includes(signerAddress))

            // Claim a SBT
            const orgTotalSupply = parseInt(await blockchainApi.totalSupply())
            const tokenId = await claimSBT(
                did.address,
                sbtType,
                uniqueId,
                sbtURI,
                RECIPIENT_WALLET.address.toLowerCase(),
                signerContextProof,
                keyring,
                blockchainApi
            )
            const newTotalSupply = parseInt(await blockchainApi.totalSupply())
            assert.ok(newTotalSupply === (orgTotalSupply + 1), "SBT claimed successfully")
        })

        it("isSBTClaimed()",async () => {
            const claimed = await blockchainApi.isSBTClaimed(RECIPIENT_WALLET.address, sbtType, uniqueId)
            assert.ok(claimed === true)
        })

        it("getClaimedSBTList()",async () => {
            const idList = await blockchainApi.getClaimedSBTList(RECIPIENT_WALLET.address)
            assert.ok(idList.length > 0)
        })

        it("tokenInfo()",async () => {
            const lastTokenId = parseInt(await blockchainApi.totalSupply())

            const tokenInfo = await blockchainApi.tokenInfo(lastTokenId)
            assert.deepEqual(tokenInfo, [sbtType, uniqueId])
        })

        it("Burn SBT", async () => {
            const lastTokenId = parseInt(await blockchainApi.totalSupply())

            const owner = await blockchainApi.ownerOf(lastTokenId)
            assert.equal(owner, RECIPIENT_WALLET.address)

            const receiverSBTClient = createBlockchainAPI(RECIPIENT_WALLET, true)
            await receiverSBTClient.burnSBT(lastTokenId)

            assert.rejects(
                blockchainApi.ownerOf(lastTokenId),
                "Not able to get owner for burnt token"
            )
        })
    })
})