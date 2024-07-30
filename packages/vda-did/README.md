
# VDA DID

Provides a client side library for creating, updating and deleting Verida DID's that match the [Verida DID specification](https://github.com/verida/VIPs/blob/develop/VIPs/vip-2.md).

You may consider using [@verida/did-client](https://github.com/verida/verida-js/tree/main/packages/did-client).

# Installation

```
yarn add @verida/vda-did @verida/did-document ethers
```

# Usage

## Create a DID

```js
import { DIDDocument } from '@verida/did-document'
import { VdaDid } from '@verida/vda-did'
import { ethers } from 'ethers'

const wallet = ethers.Wallet.createRandom()
const DID_PRIVATE_KEY = wallet.privateKey
const DID_ADDRESS = wallet.address
const DID = `did:vda:testnet:${DID_ADDRESS}`
const DID_PK = wallet.publicKey

// Choose at least three endpoints from the Acacia testnet
// https://developers.verida.network/docs/infrastructure/networks
// (This will soon be decentralized and made available on-chain)
const ENDPOINTS = [
    `https://node1-euw6.gcp.devnet.verida.tech/did/${DID}`,
    `https://node2-euw6.gcp.devnet.verida.tech/did/${DID}`,
    `https://node3-euw6.gcp.devnet.verida.tech/did/${DID}`
]

const VDA_DID_CONFIG = {
    identifier: DID,
    signKey: DID_PRIVATE_KEY,
    callType: 'web3',
    web3Options: {

    }
}

const veridaApi = new VdaDid(VDA_DID_CONFIG)

const doc = new DIDDocument(DID, DID_PK)
doc.signProof(wallet.privateKey)

const publishedEndpoints = await veridaApi.create(doc, ENDPOINTS)
console.log(publishedEndpoints)
```

## Update a DID

```js
veridaApi.update(didDocument, controllerPrivateKey)
```

Note: `controllerPrivateKey` is optional and only needs to be specified if the DID Document controller is being changed.

## Delete a DID

Deletes the DID configured in the constructor of this `VdaDid` instance.

```js
veridaApi.delete()
```

# Configuration


`const veridaApi = new VdaDid(config: VdaDidConfigurationOptions)` supports the following configuration:

```js
export interface VdaDidConfigurationOptions {
    // DID (ie: did:vda:testnet:0x...)
    identifier: string;
    // Private key of the controller
    signKey: string;
    chainNameOrId?: 'testnet' | 'mainnet';
    callType: 'gasless' | 'web3';
    web3Options: VeridaWeb3TransactionOptions;
}
```

Where:



```js
export interface Web3SelfTransactionConfig extends Web3GasConfiguration {
    // Blockchain (Polygon) private key for writing DID references
    privateKey?: string;
    // Blockchain RPC_URL (defaults to a common Polygon RPC_URL)
    rpcUrl?: string;
}
```
