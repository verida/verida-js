import { createDIDClient } from "../src/index"
// import { Wallet } from '@ethersproject/wallet'
import { Wallet } from "ethers"
import { JsonRpcProvider } from '@ethersproject/providers'

require('dotenv').config()

if (process.env.PRIVATE_KEY === undefined) {
    throw new Error('PRIVATE_KEY not defined in env')
}
const privateKey : string = process.env.PRIVATE_KEY!

const rpcUrl = process.env[`RPC_URL`]
if (rpcUrl === undefined) {
    throw new Error('RPC url is not defined in env')
}
console.log('RPC URL :', rpcUrl)


const provider = new JsonRpcProvider(rpcUrl);
const txSigner = new Wallet(privateKey, provider)

export async function getDIDClient(veridaAccount: Wallet) {
    const config = {
        network: 'testnet',
        connectMode: 'direct',
        rpcUrl: rpcUrl!
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