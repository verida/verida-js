import { DIDClient } from "../src/did-client"
import { Wallet } from "ethers"
import { DIDClientConfig, Network } from "@verida/types"

require('dotenv').config()

export async function getDIDClient(wallet: Wallet, didEndpoints: string[]) {
    const privateKey = process.env.PRIVATE_KEY
    if (!privateKey) {
        throw new Error('PRIVATE_KEY not defined in env')
    }

    const rpcUrl = process.env[`RPC_URL`]
    if (rpcUrl === undefined) {
        throw new Error('RPC url is not defined in env')
    }
    console.log('RPC URL :', rpcUrl)

    const config: DIDClientConfig = {
        network: Network.BANKSIA,
        rpcUrl: rpcUrl!
    }

    const didClient = new DIDClient(config)

    // Configure authenticate to talk directly to the blockchain
    await didClient.authenticate(
        wallet,
        'web3',
        {
            privateKey, // MATIC private key that will submit transaction
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
