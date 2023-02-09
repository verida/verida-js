import { DIDClient } from "../src/index"
// import { Wallet } from '@ethersproject/wallet'
import { Wallet } from "ethers"
import { DIDClientConfig } from "@verida/types"

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

export async function getDIDClient(veridaAccount: Wallet, didEndpoints: string[]) {
    const config: DIDClientConfig = {
        network: 'testnet',
        rpcUrl: rpcUrl!
    }

    const didClient = new DIDClient(config)

    // Configure authenticate to talk directly to the blockchain
    didClient.authenticate(
        veridaAccount.privateKey,   // Verida DID private key
        'web3',
        {
            privateKey,             // MATIC private key that will submit transaction
        },
        didEndpoints
    )

    // Configure authenticate to use meta transaction server
    /*didClient.authenticate(
        veridaAccount.privateKey,   // Verida DID private key
        'gasless',
        {
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
              endpointUrl: 'https://meta-tx-server1.tn.verida.tech'
        },
        ['http://localhost:5000/did/']
    )
    */

    return didClient
}