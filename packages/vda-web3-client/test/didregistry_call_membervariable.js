import { Console } from 'console';
import Web3 from 'web3'
import { formatBytes32String } from 'ethers/lib/utils.js'

import { createRequire } from "module";
const require = createRequire(import.meta.url);

require('dotenv').config()

/// Datas for testing
const identity = "0x268c970A5FBFdaFfdf671Fa9d88eA86Ee33e14B1"
const delegateType = formatBytes32String('veriKey')
const validity = 86400

const web3 = new Web3(
    'https://speedy-nodes-nyc.moralis.io/bd1c39d7c8ee1229b16b4a97/bsc/testnet'
);

/** Verida company wallet accoutn that pays for gass fees */
const contractAddress = "0x2862BC860f55D389bFBd1A37477651bc1642A20B";
const contractABI = require('./abi/VeridaDIDRegistry.json');

const testContract = new web3.eth.Contract(
    contractABI.abi,
    contractAddress
)

async function identityOwnerTest() {
    const response = await testContract.methods.identityOwner(identity).call()
    console.log("identityOwner - ", response)
}

/**
 * Call member variable 'changed'
 */
async function previousChangeTest() {
    const response = await testContract.methods.changed(identity).call()
    console.log("PreviousChanged - ", response)
}



async function testAll() {
    // await identityOwnerTest()

    await previousChangeTest()
    // await sleep(2000)
}

testAll()