import {getVeridaContract} from '@verida/web3'
import { createRequire } from "module";

const require = createRequire(import.meta.url);

// Datas for testing
const identity = "0x268c970A5FBFdaFfdf671Fa9d88eA86Ee33e14B1"
const identity2 = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
const delegate = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
const delegate2 = "0x90F79bf6EB2c4f870365E785982E1f101E93b906"
const delegate3 = "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65"

const delegateType = 'veriKey'
const validity = 86400

// const attributeName = formatBytes32String("encryptionKey")
// const attributeValue = formatBytes32String("encryptionKey")
const attributeName = 'verida'
const attributeValue = 'test value exist'

// Signature
const testSignature = "0x67de2d20880a7d27b71cdcb38817ba95800ca82dff557cedd91b96aacb9062e80b9e0b8cb9614fd61ce364502349e9079c26abaa21890d7bc2f1f6c8ff77f6261c"
const badSignature = "0xf157fd349172fa8bb84710d871724091947289182373198723918cabcc888ef888ff8876956050565d5757a57d868b8676876e7678687686f95419238191488923"

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

const didRegistryABI = require('./abi/VeridaDIDRegistry.json')

const didRegistry = getVeridaContract(
    'gasless', 
    {
        veridaKey: testSignature,
        abi: didRegistryABI,
        address: '0x2862BC860f55D389bFBd1A37477651bc1642A20B',
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

// console.log('Class = ', didRegistry)

async function identityOwnerTest() {
    const response = await didRegistry.identityOwner(identity)
    console.log("identityOwner - ", response.data)
}

async function previousChangeTest() {
    const response = await didRegistry.changed(identity)
    console.log("previousChange - ", response.data)
}


async function changeOwnerTest() {
    const response = await didRegistry.changeOwner(
        identity,
        delegate,
        testSignature
    )

    // console.log('Returned: ', response)
    console.log("changeOwner - ", response.success)
}

async function addDelegateTest() {
    const response = await didRegistry.addDelegate(
        identity,
        delegateType,
        delegate3,
        validity,
        testSignature
    )

    // console.log('Returned: ', response.data)
    console.log("addDelegate - ", response.success)
}

async function revokeDelegateTest() {
    const response = await didRegistry.revokeDelegate(
        identity,
        delegateType,
        delegate3,
        testSignature
    )

    // console.log('Returned', response.data)
    console.log("revokeDelegate - ", response.success)
}

async function setAttributeTest() {
    const response = await didRegistry.setAttribute(
        identity,
        attributeName,
        attributeValue,
        validity,
        testSignature
    )

    // console.log('Returned', response.data)
    console.log("setAttribute - ", response.success)
}

async function revokeAttributeTest() {
    const response = await didRegistry.revokeAttribute(
        identity,
        attributeName,
        attributeValue,
        testSignature
    )

    // console.log('Returned', response.data)
    console.log("revokeAttribute - ", response.success)
}

async function bulkAddTest() {
    const delegateParams = []
    
    const attributeParams = []
    
    delegateParams.push({
        delegateType: 'veriKey',
        delegate: delegate3,
        validity: 86400
    })
    
    delegateParams.push({
        delegateType: 'sigAuth',
        delegate: delegate2,
        validity: 86400
    })
    
    attributeParams.push({
        name: "encryptionKey",
        value: "0x12345678",
        validity: 86400
    })

    const response = await didRegistry.bulkAdd(
        identity,
        delegateParams,
        attributeParams,
        testSignature
    )

    // console.log("Return: ", response)
    console.log("bulkAdd - ", response.success)
}

async function bulkRevokeTest() {
    const delegateParams = []
    
    const attributeParams = []
    
    delegateParams.push({
        delegateType: 'veriKey',
        delegate: delegate3,
    })
    
    delegateParams.push({
        delegateType: 'sigAuth',
        delegate: delegate2,
    })
    
    attributeParams.push({
        name: "encryptionKey",
        value: "0x12345678",
    })

    const response = await didRegistry.bulkRevoke(
        identity,
        delegateParams,
        attributeParams,
        testSignature
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