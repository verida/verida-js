require('dotenv').config();
import { dids, getBlockchainAPIConfiguration } from "./utils"
import { VeridaSBTClient } from "../src/index"
import { ethers, Wallet } from "ethers";
import EncryptionUtils from "@verida/encryption-utils";

const assert = require('assert')

const did = dids[0];
  

const configuration = getBlockchainAPIConfiguration();
const createBlockchainAPI = (did: any) => {
    return new VeridaSBTClient({
        identifier: did.address,
        signKey: did.privateKey,
        chainNameOrId: "testnet",
        ...configuration
    })
}

describe('vda-sbt-client blockchain api', () => {
    let blockchainApi : VeridaSBTClient
    

    before(() => {
        blockchainApi = createBlockchainAPI(did);
    })

    describe("totalSupply", () => {
        it("totalSupply",async () => {
            const totalSupply = parseInt(await blockchainApi.totalSupply());
            assert.ok(totalSupply > 0, "Get total supply")
        })    
    })
    
    describe("tokenURI", () => {
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
    
    describe("isLocked", async () => {
        it("Should reject for invalid token IDs",async () => {
            await assert.rejects(
                blockchainApi.isLocked(0)
            )
        })

        it("Should reject for burnt token IDs",async () => {
            await assert.rejects(
                blockchainApi.isLocked(22)
            )
        })

        it("Should be locked for all minted tokenIDs",async () => {
            const tokenIdList = [1,2,3,20]

            for (let i = 0; i <= tokenIdList.length; i+=7) {
                const locked = await blockchainApi.isLocked(tokenIdList[i])
                assert.equal(locked, true, "Locked correctly")
            }
        })
    })

    describe("getTrustedSignerAddresses", () => {
        it("Get trusted signers successfully", async () => {
            const signers = parseInt((await blockchainApi.getTrustedSignerAddresses()).length)
            assert.ok(signers > 0)
        })
    })

    describe("SBT claim & burn", () => {
        /**
         * `signedData` of the SBTInfo struct should be signed by `sbtSigner`.
         * `signedProof` of the SBTInfo struct should be signed by `trustedSigner`.
         */
        const trustedSigner = dids[2]
        const sbtSigner = dids[3]

        // Claim a sbt to the "did" for burning test
        const claimer = did.address

        // SBT info
        const sbtType = "twitter"
        const sbtId = "testId-3" //+ Wallet.createRandom().address
        const sbtURI = "https://gateway.pinata.cloud/ipfs/QmVrTkbrzNHRhmsh88XnwJo5gBu8WqQMFTkVB4KoVLxSEY/3.json"

        it("Claim a SBT successfully",async () => {
            // Should check if the trustedSigner is registered to the contract
            const signers = await blockchainApi.getTrustedSignerAddresses()
            assert.ok(signers.includes(trustedSigner.address))

            // Create SBT Info
            /// generate signedData of SBTInfo
            let privateKeyArray = new Uint8Array(
                Buffer.from(sbtSigner.privateKey.slice(2), "hex")
            );
            const signedDataMsg = ethers.utils.solidityPack(
                ['string','address'],
                [`${sbtType}-${sbtId}-`, did.address]
            )
            const signedData = EncryptionUtils.signData(signedDataMsg, privateKeyArray)

            /// generate signedProof of SBTInfo
            const signedProofMsg = `${trustedSigner.address}${sbtSigner.address}`.toLowerCase()
            privateKeyArray = new Uint8Array(
                Buffer.from(trustedSigner.privateKey.slice(2), "hex")
            );
            const signedProof = EncryptionUtils.signData(signedProofMsg, privateKeyArray)

            // Claim SBT
            const orgTotalSupply = parseInt(await blockchainApi.totalSupply())

            await blockchainApi.claimSBT(
                sbtType,
                sbtId,
                sbtURI,
                claimer,
                signedData,
                signedProof                
            )

            const newTotalSupply = parseInt(await blockchainApi.totalSupply())

            assert.ok(newTotalSupply === (orgTotalSupply + 1), "SBT claimed successfully")
        })

        it("isSBTClaimed()",async () => {
            const claimed = await blockchainApi.isSBTClaimed(sbtType, sbtId)
            assert.ok(claimed === true)
        })

        it("tokenInfo()",async () => {
            const lastTokenId = parseInt(await blockchainApi.totalSupply())

            const tokenInfo = await blockchainApi.tokenInfo(lastTokenId)
            assert.deepEqual(tokenInfo, [sbtType, sbtId])
        })

        it("Burn SBT", async () => {
            const lastTokenId = parseInt(await blockchainApi.totalSupply())

            const owner = await blockchainApi.ownerOf(lastTokenId)
            assert.equal(owner, did.address)

            await blockchainApi.burnSBT(lastTokenId)

            assert.rejects(
                blockchainApi.ownerOf(lastTokenId),
                "Not able to get owner for burnt token"
            )
        })
    })
})