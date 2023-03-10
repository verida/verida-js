require('dotenv').config();
import { dids, getBlockchainAPIConfiguration, getNetwork, getSignerInfo, CONTEXT_NAME, RECIPIENT_WALLET } from "./utils"
import { VeridaSBTClient } from "../src/index"
import { ethers, Wallet } from "ethers";
import { Keyring } from "@verida/keyring";

const assert = require('assert')

const did = dids[0];

// tokenReceiver should be the same as the did to test the burn() function 
// of the SBT contract. Because only the owner of tokenID can call the burn 
// function and all the transactions of vda-sbt-client instance will be 
// signed by the did
const tokenReceiver = RECIPIENT_WALLET

const mintedTokenIds = [1, 3, 5]
const burntTokenIds = [2, 4]

interface InterfaceDID {
    address: string
    privateKey: string
    publicKey: string
}

const createBlockchainAPI = (did: InterfaceDID) => {
    const configuration = getBlockchainAPIConfiguration(did.privateKey);
    return new VeridaSBTClient({
        identifier: did.address,
        signKey: did.privateKey,
        chainNameOrId: "testnet",
        ...configuration
    })
}

const claimSBT = async (
    didAddress: string,
    sbtType: string,
    uniqueId: string,
    sbtURI: string,
    receiverAddress: string,
    signedProof: string,
    keyring: Keyring,
    blockchainApi: VeridaSBTClient
) => {
    const signedDataMsg = ethers.utils.solidityPack(
        ['string','address'],
        [`${sbtType}-${uniqueId}-`, didAddress.toLowerCase()]
    )
    const signedData = await keyring.sign(signedDataMsg)

    await blockchainApi.claimSBT(
        sbtType,
        uniqueId,
        sbtURI,
        receiverAddress.toLowerCase(),
        signedData,
        signedProof
    )
}

const createTestDataIfNotExist = async (
    trustedSigner: InterfaceDID, 
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
    assert.ok(signers.includes(trustedSigner.address))

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
    const receiverSBTClient = createBlockchainAPI(RECIPIENT_WALLET)
    for (const id of burntTokenIds) {
        await receiverSBTClient.burnSBT(id)
    }

    console.log("Initial test data created")
}

describe('vda-sbt-client blockchain api', () => {
    let blockchainApi : VeridaSBTClient

    const trustedSigner = dids[2]
    let keyring: Keyring
    let signedProof: string

    before(async () => {
        blockchainApi = createBlockchainAPI(did);
        [keyring, signedProof] = await getSignerInfo(trustedSigner.privateKey)

        await createTestDataIfNotExist(trustedSigner, blockchainApi, keyring, signedProof)
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
    
    describe("isLocked", async () => {
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
            const tokenIdList = [1,2,3,20]

            for (const tokenId of mintedTokenIds) {
                const locked = await blockchainApi.isLocked(tokenId)
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

    describe("SBT claim & burn", function() {
        this.timeout(60*1000)

        // SBT info
        const sbtType = "twitter-test"
        const uniqueId = "12346789"
        const sbtURI = "https://gateway.pinata.cloud/ipfs/QmVrTkbrzNHRhmsh88XnwJo5gBu8WqQMFTkVB4KoVLxSEY/3.json"

        it("Claim a SBT successfully",async () => {
            const trustedSigner = dids[2]
            const trustedSignerNetworkInfo = await getNetwork(trustedSigner.privateKey)
            const trustedDid = await trustedSignerNetworkInfo.account.did()
            const trustedSignerDIDDocument = await trustedSignerNetworkInfo.account.getDidClient().get(trustedDid)

            // Should check if the trustedSigner is registered to the contract
            const signers = await blockchainApi.getTrustedSignerAddresses()
            assert.ok(signers.includes(trustedSigner.address))

            // Claim a SBT
            const orgTotalSupply = parseInt(await blockchainApi.totalSupply())
            await claimSBT(
                did.address,
                sbtType,
                uniqueId,
                sbtURI,
                RECIPIENT_WALLET.address.toLowerCase(),
                signedProof,
                keyring,
                blockchainApi
            )
            const newTotalSupply = parseInt(await blockchainApi.totalSupply())
            assert.ok(newTotalSupply === (orgTotalSupply + 1), "SBT claimed successfully")
        })

        it("isSBTClaimed()",async () => {
            const claimed = await blockchainApi.isSBTClaimed(sbtType, uniqueId)
            assert.ok(claimed === true)
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

            const receiverSBTClient = createBlockchainAPI(RECIPIENT_WALLET)
            await receiverSBTClient.burnSBT(lastTokenId)

            assert.rejects(
                blockchainApi.ownerOf(lastTokenId),
                "Not able to get owner for burnt token"
            )
        })
    })
})