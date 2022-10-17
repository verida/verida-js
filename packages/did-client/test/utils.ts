import { DIDClient, DIDClientConfig } from "../src/index"
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
    const config: DIDClientConfig = {
        network: 'testnet',
        rpcUrl: rpcUrl!
    }

    const didClient = new DIDClient(config)

    // Configure authenticate to talk directly to the blockchain
    didClient.authenticate(
        veridaAccount.privateKey,
        'web3',
        {
            signer: txSigner
        }
    )

    // Configure authenticate to use meta transaction server
    /*didClient.authenticate(
        veridaAccount.privateKey,
        'gasless',
        {
            veridaKey: veridaAccount.privateKey,
            serverConfig: {
                headers: {
                    'context-name' : 'Verida Test'
                } 
              },
              postConfig: {
                  headers: {
                      'user-agent': 'Verida-Vault'
                  }
              },
              endpointUrl: 'http://localhost:5021'
        }
    )*/

    return didClient
}