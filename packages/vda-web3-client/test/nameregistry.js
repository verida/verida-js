import {getVeridaContract} from '@verida/web3'
import { createRequire } from "module";
import { JsonRpcProvider } from '@ethersproject/providers'
import { Wallet } from '@ethersproject/wallet'

const require = createRequire(import.meta.url);
require('dotenv').config()

const args = process.argv.slice(2);
const testMode = (args.length > 0 && args[0] === 'direct' )? args[0] : "gasless"
console.log('Test mode : ', testMode)

// Datas for testing
const testNames = [
    "John.verida",
    "Smith Elba.verida",
    "Bill Clin.verida",
    "Jerry Smith.verida",

    "Jerry Smith.test",
    "Billy.test",
  ];

const testDIDs = [
    "0x181aB2d2F0143cd2046253c56379f7eDb1E9C133",
    "0x2b3f34e9d4b127797ce6244ea341a83733ddd6e4",
    "0x327c1FEd75440d4c3fA067E633A3983D211f0dfD",
    "0x4f41ce9d745404acd3f068E632A1781Da11f0dfD",
  ];

const zeroAddress = "0x0000000000000000000000000000000000000000";

// Signature
const testSignature = "0x67de2d20880a7d27b71cdcb38817ba95800ca82dff557cedd91b96aacb9062e80b9e0b8cb9614fd61ce364502349e9079c26abaa21890d7bc2f1f6c8ff77f6261c"
const badSignature = "0xf157fd349172fa8bb84710d871724091947289182373198723918cabcc888ef888ff8876956050565d5757a57d868b8676876e7678687686f95419238191488923"

// Create SDK Instance in direct mode
const provider = new JsonRpcProvider(process.env.RPC_URL_BSC_TESTNET);
const txSigner = new Wallet(process.env.PRIVATE_KEY, provider)

const nameRegistryABI = require('./abi/NameRegistry.json')
const nameRegistry = testMode === 'gasless' ?
    getVeridaContract(
        'gasless', 
        {
            veridaKey: testSignature,
            abi: nameRegistryABI,
            address: '0x5c5CA3376b2C82f0322DB9dEE0504D2565080865',
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
    ) : 
    getVeridaContract(
        'web3', 
        {
            abi: nameRegistryABI,
            address: process.env.CONTRACT_ADDRESS_RPC_URL_BSC_TESTNET_NameRegistry,

            provider: provider,
            signer: txSigner
        }
    )
// console.log('Class = ', nameRegistry)

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

async function registerTest() {
    try {
        const response = await nameRegistry.register(
            testNames[0],
            testDIDs[0],
            testSignature
        )
        console.log('register - ', response.success)
    } catch (e) {
        console.log('register error : ', e)
    }    
}

async function findDidTest() {
    const response = await nameRegistry.findDid(
        testNames[0]
    )

    console.log("findDid - ", response.data);
}

async function getUserNameListTest() {
    const response = await nameRegistry.getUserNameList(
        testDIDs[0],
        testSignature
    )

    console.log('getUserNameList - ', response.data)
}

async function unregisterTest() {
    const response = await nameRegistry.unregister(
        testNames[0],
        testDIDs[0],
        testSignature
    )

    console.log('unregister - ', response.success)
}


async function testAll() {
    await registerTest()
    await sleep(2000)

    await findDidTest();
    await sleep(2000)

    await getUserNameListTest();
    await sleep(2000)

    await unregisterTest();
}

testAll()