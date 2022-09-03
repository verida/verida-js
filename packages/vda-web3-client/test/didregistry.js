import {getVeridaContract} from '@verida/web3'
import { formatBytes32String } from 'ethers/lib/utils.js'
import { JsonRpcProvider } from '@ethersproject/providers'
import { Wallet } from '@ethersproject/wallet'
import ethers from 'ethers'

import EncryptionUtils from '@verida/encryption-utils'

import {decodeAttrValue, attributeToHex} from './helpers.js'

import { createRequire } from "module";
const require = createRequire(import.meta.url);

require('dotenv').config()

const args = process.argv.slice(2);
const testMode = (args.length > 0 && args[0] === 'direct' )? args[0] : "gasless"
console.log('Test mode : ', testMode)

/// Datas for testing
const privateKey = '0x' + process.env.PRIVATE_KEY;
const did = (new Wallet(privateKey.slice(2))).address

const testAccounts = [
    Wallet.createRandom(),
    Wallet.createRandom(),
    Wallet.createRandom(),
    Wallet.createRandom()
]
  
const zeroAddress = "0x0000000000000000000000000000000000000000"

const delegate = testAccounts[0].address
const delegateType = formatBytes32String('veriKey')
const validity = 86400

const attributeName = "did/pub/Secp256k1/sigAuth/hex"
const attributeValue = `${testAccounts[1].publicKey}?context=${testAccounts[2].address}`
const proofProvider = ethers.utils.computeAddress(testAccounts[1].publicKey)

const TARGET_NET = process.env.RPC_TARGET_NET
if (TARGET_NET === undefined) {
    throw new Error('RPC_TARGET_NET not defiend in env')
}
console.log('Target Net : ', TARGET_NET)

const RPC_URL = process.env[TARGET_NET]
if (RPC_URL === undefined) {
    throw new Error('RPC url not defined in env')
}
console.log('RPC URL : ', RPC_URL)

const CONTRACT_ADDRESS = process.env[`CONTRACT_ADDRESS_${TARGET_NET}_DidRegistry`]
if (CONTRACT_ADDRESS === undefined) {
    throw new Error('Contract address not defined in env')
}
console.log('Contract : ', CONTRACT_ADDRESS)

const provider = new JsonRpcProvider(RPC_URL);
const txSigner = new Wallet(process.env.PRIVATE_KEY, provider)

const didRegistryABI = require('./abi/VeridaDIDRegistry.json')
let didRegistry
if (testMode === 'direct') {
    didRegistry = getVeridaContract(
        'web3', 
        {
            abi: didRegistryABI,
            address: CONTRACT_ADDRESS,
            provider: provider,
            signer: txSigner
        }
    )
} else {
    didRegistry = getVeridaContract(
        'gasless', 
        {
            veridaKey: 'Verida License Here',
            abi: didRegistryABI,
            address: CONTRACT_ADDRESS,
            serverConfig: {
                headers: {
                    'context-name' : 'Verida Test'
                } 
            },
            postConfig: {
                headers: {
                    'user-agent': 'Verida-Vault'
                }
            }
        }
    )
}

const getVeridaSign = async (rawMsg, privateKey, docDID = did) => {
    if (didRegistry === undefined)
        return ''

    let nonceRet = await didRegistry.getNonce(docDID)
    if (!nonceRet.success) 
        return ''

    const nonce = nonceRet.data
    rawMsg = ethers.utils.solidityPack(
        ['bytes','uint256'],
        [rawMsg, nonce]
    )
    const privateKeyArray = new Uint8Array(Buffer.from(privateKey.slice(2), 'hex'))
    return EncryptionUtils.default.signData(rawMsg, privateKeyArray)
}

const getProofSign = (rawMsg , privateKey ) => {
    const privateKeyArray = new Uint8Array(Buffer.from(privateKey.slice(2), 'hex'))
    return EncryptionUtils.default.signData(rawMsg, privateKeyArray)
}

// console.log('Class = ', didRegistry)

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

async function identityOwnerTest() {
    const response = await didRegistry.identityOwner(did)
    console.log("identityOwner - ", response.data)
}

async function previousChangeTest() {
    const response = await didRegistry.changed(did)
    console.log("PreviousChanged - ", response.data)
}

async function changeOwnerTest() {
    const orgDID = Wallet.createRandom()
    const newOwner = Wallet.createRandom().address

    const rawMsg = ethers.utils.solidityPack(['address', 'address'], [orgDID.address, newOwner])
    const signature = await getVeridaSign(rawMsg, orgDID.privateKey, orgDID.address)
    
    const response = await didRegistry.changeOwner(
        orgDID.address,
        newOwner,
        signature
    )

    console.log("changeOwner - ", response.success)
}

async function addDelegateTest() {
    const rawMsg = ethers.utils.solidityPack(
        ['address', 'bytes32', 'address', 'uint'],
        [did, delegateType, delegate, validity]
    )
    const signature = await getVeridaSign(rawMsg, privateKey)
    const response = await didRegistry.addDelegate(
        did,
        delegateType,
        delegate,
        validity,
        signature
    )

    // console.log('Returned: ', response)
    console.log("addDelegate - ", response.success)
}

async function revokeDelegateTest() {
    const rawMsg = ethers.utils.solidityPack(
        ['address', 'bytes32', 'address'],
        [did, delegateType, delegate]
    )
    const signature = await getVeridaSign(rawMsg, privateKey)
    const response = await didRegistry.revokeDelegate(
        did,
        delegateType,
        delegate,
        signature
    )

    // console.log('Returned', response.data)
    console.log("revokeDelegate - ", response.success)
}

async function setAttributeTest() {
    const proofRawMsg = ethers.utils.solidityPack(
        ['address', 'address'],
        [did, proofProvider]
    )
    const proof = getProofSign(proofRawMsg, privateKey)

    const key = formatBytes32String(attributeName)
    const value = attributeToHex(attributeName, attributeValue)

    const rawMsg = ethers.utils.solidityPack(
        ['address', 'bytes32', 'bytes', 'uint', 'bytes'],
        [did, key, value, validity, proof]
    )
    const signature = await getVeridaSign(rawMsg, privateKey)

    const response = await didRegistry.setAttribute(
        did,
        key,
        value,
        validity,
        proof,
        signature
    )

    // console.log('Returned', response.data)
    console.log("setAttribute - ", response.success)
}

async function revokeAttributeTest() {
    const key = formatBytes32String(attributeName)
    const value = attributeToHex(attributeName, attributeValue)

    const rawMsg = ethers.utils.solidityPack(['address', 'bytes32', 'bytes'], [did, key, value])
    const signature = await getVeridaSign(rawMsg, privateKey)

    const response = await didRegistry.revokeAttribute(
        did,
        key,
        value,
        signature
    )

    // console.log('Returned', response.data)
    console.log("revokeAttribute - ", response.success)
}

async function bulkAddTest() {
    const delegateParams = []
    const attributeParams = []

    // Add Delegates
    for (let i = 0; i < 2; i++) {
        delegateParams.push({
            delegateType: formatBytes32String('veriKey'),
            delegate: testAccounts[i].address,
            validity: 86400
        })
    }

    // Add attribute
    const proofRawMsg = ethers.utils.solidityPack(
        ['address', 'address'],
        [did, proofProvider]
    )
    const proof = getProofSign(proofRawMsg, privateKey)

    const key = formatBytes32String(attributeName)
    const value = attributeToHex(attributeName, attributeValue)
    attributeParams.push({
        name: key,
        value: value,
        validity: 86400,
        proof
    })

    // Create signature
    let rawMsg = ethers.utils.solidityPack(['address'], [did])
    delegateParams.forEach(item => {
        rawMsg = ethers.utils.solidityPack(
            ['bytes','bytes32','address','uint'],
            [rawMsg, item.delegateType, item.delegate, item.validity]
        )
    })
    attributeParams.forEach(item => {
        rawMsg = ethers.utils.solidityPack(
            ['bytes','bytes32','bytes','uint','bytes'],
            [rawMsg, item.name, item.value, item.validity,item.proof]
        )
    })

    const signature = await getVeridaSign(rawMsg, privateKey)

    const response = await didRegistry.bulkAdd(
        did,
        delegateParams,
        attributeParams,
        signature
    )

    // console.log("Return: ", response)
    console.log("bulkAdd - ", response.success)
}

async function bulkRevokeTest() {
    const delegateParams = []
    
    const attributeParams = []

    // Add Delegates
    for (let i = 0; i < 2; i++) {
        delegateParams.push({
            delegateType: formatBytes32String('veriKey'),
            delegate: testAccounts[i].address,
        })
    }

    // Add attribute
    const key = formatBytes32String(attributeName)
    const value = attributeToHex(attributeName, attributeValue)
    attributeParams.push({
        name: key,
        value: value,
    })

    // Create signature
    let rawMsg = ethers.utils.solidityPack(['address'], [did])
    delegateParams.forEach(item => {
        rawMsg = ethers.utils.solidityPack(
            ['bytes','bytes32','address'],
            [rawMsg, item.delegateType, item.delegate]
        )
    })

    attributeParams.forEach(item => {
        rawMsg = ethers.utils.solidityPack(
            ['bytes','bytes32','bytes'],
            [rawMsg, item.name, item.value]
        )
    })
    const signature = await getVeridaSign(rawMsg, privateKey)
    
    const response = await didRegistry.bulkRevoke(
        did,
        delegateParams,
        attributeParams,
        signature
    )

    // console.log("Return: ", response)
    console.log("bulkRevoke - ", response.success)
}

async function testAll() {
    await identityOwnerTest()
    await sleep(2000)

    await previousChangeTest()
    await sleep(2000)

    await changeOwnerTest()
    await sleep(2000)

    await addDelegateTest()
    await sleep(2000)
    await revokeDelegateTest()
    await sleep(2000)

    await setAttributeTest()
    await sleep(2000)
    await revokeAttributeTest()
    await sleep(2000)

    await bulkAddTest()
    await sleep(2000)
    await bulkRevokeTest()
}

testAll()