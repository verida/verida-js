const assert = require('assert')
import { ethers } from 'ethers'
import { getBlockchainAPIConfiguration } from "./utils"
import { NameClient, NameClientConfig } from '../src'

const baseConfig = getBlockchainAPIConfiguration()

const wallet = ethers.Wallet.createRandom()
const DID_PRIVATE_KEY = wallet.privateKey
const DID_ADDRESS = wallet.address
const DID = `did:vda:testnet:${DID_ADDRESS}`
const DID_PK = wallet.publicKey

const CONFIG: NameClientConfig = {
    did: DID,
    network: 'testnet',
    rpcUrl: baseConfig.rpcUrl,
    privateKey: DID_PRIVATE_KEY,
    callType: baseConfig.callType,
    web3Options: baseConfig.web3Options
}

const nameService = new NameClient(CONFIG)

const goodUsername = ['dave123.vda', 'jane-123.vda']
const badUsername = {
    'hello': 'No Suffix',
    'a.vda': 'Too short',
    '@#$&@#': 'Invalid characters',
    'mark.stevens': 'Invalid characters'
}

describe("Name client tests", function() {
    this.beforeAll(async () => {
    })

    describe.only("Register", () => {
        this.timeout(20 * 1000)
        
        it("Success", async () => {
            const username = goodUsername[0]
            const result = await nameService.register(username)
            console.log(result)
        })
    })

    describe("Get DID Address", () => {
        this.timeout(20 * 1000)
        
        it("Success", async () => {
            const result = await nameService.getDidAddress(goodUsername[0])
            console.log(result)
        })
    })

    describe("Get Usernames", () => {
        this.timeout(20 * 1000)
        
        it("Success", async () => {
            const result = await nameService.getUsernames(CONFIG.did)
            console.log(result)
        })
    })
})