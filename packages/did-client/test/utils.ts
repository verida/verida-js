import { createDIDClient } from "../src/index"
// import { Wallet } from '@ethersproject/wallet'
import { Wallet } from "ethers"
import { JsonRpcProvider } from '@ethersproject/providers'

require('dotenv').config()

if (process.env.PRIVATE_KEY === undefined) {
    throw new Error('PRIVATE_KEY not defined in env')
}
const privateKey : string = process.env.PRIVATE_KEY!

const currentNet = process.env.RPC_TARGET_NET
if (currentNet === undefined) {
    throw new Error('RPC_TARGET_NET is not defined in env')
}

export const chainId = process.env[`CHAIN_ID_${currentNet}`]
if (chainId === undefined) {
  throw new Error('Chain ID not defined in env')
}
console.log('Chain Id : ', chainId)

const rpcUrl = process.env[`${currentNet}`]
if (rpcUrl === undefined) {
    throw new Error('RPC url is not defined in env')
}
console.log('RPC URL :', rpcUrl)

const registry = process.env[`CONTRACT_ADDRESS_${currentNet}_DidRegistry`]
if (registry === undefined) {
    throw new Error("Registry address not defined in env")
}
console.log('Contract : ', registry)



const provider = new JsonRpcProvider(rpcUrl);
const txSigner = new Wallet(privateKey, provider)

export async function getDIDClient(veridaAccount: Wallet) {
    const identity = veridaAccount.address
    const config = {
        identifier : identity, // DID
        // chainName? : string, 
        chainId : chainId,
    
        // common to vda-did resolver & vda-did self transaction config
        provider,
        rpcUrl,
        registry,
    }

    const didClient = await createDIDClient(config)

    didClient.authenticate(
        veridaAccount.privateKey,
        'web3',
        {
            signer: txSigner
        }
    )

    return didClient
}