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
    network: 'testnet',
    rpcUrl: baseConfig.rpcUrl,
    callType: baseConfig.callType,
    web3Options: baseConfig.web3Options
}

console.log(CONFIG)
console.log({
    DID,
    DID_PRIVATE_KEY
})

const nameService = new NameClient(CONFIG)
nameService.authenticate(DID, DID_PRIVATE_KEY)

const goodUsername = ['dave123.verida', 'jane-123.verida']
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

    describe("Unregister", () => {
        this.timeout(20 * 1000)
        
        it("Success", async () => {
            const username = goodUsername[0]
            const result = await nameService.unregister(username)
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