import { DIDClient } from '@verida/did-client'

import { Wallet } from "ethers"
import {  BlockchainAnchor } from '@verida/types'

require('dotenv').config()

export async function getDIDClient(wallet: Wallet) {
    const privateKey = process.env.PRIVATE_KEY
    if (!privateKey) {
        throw new Error('PRIVATE_KEY not defined in env')
    }

    const rpcUrl = process.env.RPC_URL
    if (!rpcUrl) {
        throw new Error('RPC url is not defined in env')
    }
    console.log('RPC URL :', rpcUrl)

    const didClient = new DIDClient({
        blockchain: BlockchainAnchor.POLAMOY,
        rpcUrl
    })

    await didClient.authenticate(
        wallet,
        'web3',
        {
            privateKey
        },
        ['https://node1-euw6.gcp.devnet.verida.tech/did/']
    )

    return didClient
}

export const CONTEXT_NAME = 'Test App'
