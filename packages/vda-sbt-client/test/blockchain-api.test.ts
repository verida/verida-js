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
    createBlockchainAPI,
    claimSBT,
    createTestDataIfNotExist
} from './utils'
import { BigNumber } from 'ethers';
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
        this.timeout(200*1000)
        blockchainApi = createBlockchainAPI(did);
        [keyring, signerContextProof] = await getSignerInfo(trustedSigner.privateKey, CONTEXT_NAME)

        await createTestDataIfNotExist(did, tokenReceiver, trustedSigner, blockchainApi, keyring, signerContextProof)
    })

    describe("getTrustedSignerAddresses", () => {
        it("Get trusted signers successfully", async () => {
            const signers = await blockchainApi.getTrustedSignerAddresses()
            const signerLength = parseInt(signers.length)
            assert.ok(signerLength > 0)
        })
    })

    describe("Claim", function() {
        this.timeout(200*1000)

        // SBT info
        const sbtType = "twitter"
        const uniqueId = "-uiniqueId" + new Date().getTime();
        const sbtURI = "https://gateway.pinata.cloud/ipfs/QmVrTkbrzNHRhmsh88XnwJo5gBu8WqQMFTkVB4KoVLxSEY/3.json"

        it("Claim a SBT successfully",async () => {
            const trustedSignerNetworkInfo = await getNetwork(trustedSigner.privateKey, CONTEXT_NAME)
            const trustedDid = await trustedSignerNetworkInfo.account.did()
            const trustedSignerDIDDocument = await trustedSignerNetworkInfo.account.getDIDClient().get(trustedDid)
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
    })

    describe("isLocked - Success", () => {
        it("Should be locked for minted tokenIDs",async () => {
            const lastTokenId = parseInt(await blockchainApi.totalSupply())

            const locked = await blockchainApi.isLocked(lastTokenId)
            assert.equal(locked, true, "Locked correctly")
        })
    })

    describe("totalSupply", () => {
        it("totalSupply",async () => {
            const totalSupply = parseInt(await blockchainApi.totalSupply());
            assert.ok(totalSupply > 0, "Get total supply")
        })    
    })
    
    describe("tokenURI", function() {
        this.timeout(60*1000)

        let totalSupply : BigNumber;
        before(async () => {
            totalSupply = await blockchainApi.totalSupply();
        })

        it("Should reject for invalid token IDs",async () => {
            await assert.rejects(
                blockchainApi.tokenURI(0)
            )

            await assert.rejects(
                blockchainApi.tokenURI(totalSupply.add(1))
            )
        })

        it("Get tokenURI successfully", async () => {
            assert.ok(totalSupply.gt(0), "TotalSupply should be greater than 0")

            const tokenURI = await blockchainApi.tokenURI(1)
            assert.ok(tokenURI && tokenURI.length > 0)
        })
    })

    describe("burn", function () {
        this.timeout(200*1000)

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

    describe("isLocked - Failed", function() {
        this.timeout(60*1000)

        it("Should reject for invalid token IDs",async () => {
            await assert.rejects(
                blockchainApi.isLocked(0)
            )
        })

        it("Should reject for burnt token IDs",async () => {
            // Burnt by "burn" test
            const lastTokenId = parseInt(await blockchainApi.totalSupply())
            await assert.rejects(
                blockchainApi.isLocked(lastTokenId)
            )
        })
    })
})