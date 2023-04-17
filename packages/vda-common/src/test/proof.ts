import { EnvironmentType } from "@verida/types";
import { Client, Context } from '@verida/client-ts'
import { AutoAccount } from '@verida/account-node'
import { Keyring } from "@verida/keyring";

require('dotenv').config();

const VERIDA_ENVIRONMENT = EnvironmentType.TESTNET
// const DEFAULT_CONTEXT_NAME = 'Verida Testing : Default Context'
const DEFAULT_ENDPOINTS = {
    "defaultDatabaseServer": {
        "type": "VeridaDatabase",
        "endpointUri": ["https://node1-euw6.gcp.devnet.verida.tech/", "https://node2-euw6.gcp.devnet.verida.tech/", "https://node3-euw6.gcp.devnet.verida.tech/"]
    },
    "defaultMessageServer": {
        "type": "VeridaMessage",
        "endpointUri": ["https://node1-euw6.gcp.devnet.verida.tech/", "https://node2-euw6.gcp.devnet.verida.tech/", "https://node3-euw6.gcp.devnet.verida.tech/"]
    }
}
const DID_CLIENT_CONFIG = {
    callType: "web3",
    network: EnvironmentType.TESTNET,
    web3Config: {
      privateKey: process.env.PRIVATE_KEY
    },
    rpcUrl: "https://rpc-mumbai.maticvigil.com/",
    didEndpoints: ["https://node1-euw6.gcp.devnet.verida.tech/did/", "https://node2-euw6.gcp.devnet.verida.tech/did/", "https://node3-euw6.gcp.devnet.verida.tech/did/"]
}
  
export async function getNetwork(privateKey: string, contextName: string): Promise<{
    network: Client,
    context: Context,
    account: AutoAccount,
    keyring: Keyring
  }> {
    const network = new Client({
        environment: VERIDA_ENVIRONMENT
    })
    const account = new AutoAccount(DEFAULT_ENDPOINTS, {
        privateKey,
        environment: VERIDA_ENVIRONMENT,
        // @ts-ignore
        didClientConfig: DID_CLIENT_CONFIG
    })
    await network.connect(account)
    const context = <Context> await network.openContext(contextName)
    const keyring = await account.keyring(contextName)
  
    return {
        network,
        context,
        account,
        keyring
    }
}
  
/**
 * Return keyring & signedProof for given trusted signer
 * @param privateKey private key of trusted signer
 */
export async function getSignerInfo(privateKey: string, contextName : string): Promise<[
    keyring: Keyring,
    signedProof: string
  ]> {
    const trustedSignerNetworkInfo = await getNetwork(privateKey, contextName)
    const trustedDid = await trustedSignerNetworkInfo.account.did()
    const trustedSignerDIDDocument = await trustedSignerNetworkInfo.account.getDidClient().get(trustedDid)
  
    const signedProof = trustedSignerDIDDocument.locateContextProof(contextName)!
  
    return [
      trustedSignerNetworkInfo.keyring,
      signedProof
    ]
}