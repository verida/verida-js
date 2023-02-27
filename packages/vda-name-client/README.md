
# VDA Name Client

A client library for registering / unregistering a human readable username alias for a DID.

DID's can have multiple usernames (although the smart contract currently limits to just `1`)

## Installation

```
yarn add @verida/vda-name-client
```

## Usage

### Setup

```ts
import { VeridaNameClient } from '@verida/vda-name-client'

// DID address that controls the proof of eligibility to mint the SBT
const DID_ADDRESS = '0x...'
// DID private key that controls the proof of eligibility to mint the SBT
const DID_PRIVATE_KEY = '0x...'
// Polygon private key that will fund blockchain transactions
const POLYGON_PRIVATE_KEY = '0x...'
// Polygon RPC URL (Mumbai testnet)
const RPC_URL = 'https://rpc-mumbai.maticvigil.com'

// Create name Client
const nameClient = new VeridaNameClient({
    callType: 'web3',
    identifier: DID_ADDRESS,
    signKey: DID_PRIVATE_KEY,
    chainNameOrId: "testnet" | "mainnet,
    web3Options: {
        rpcUrl: RPC_URL,
        privateKey: POLYGON_PRIVATE_KEY
    }
})
```

### Register a name

```ts
const USERNAME = 'johndoe.vda'

await nameClient.register(USERNAME)
```

### Unregister a name

```ts
const USERNAME = 'johndoe.vda'

await nameClient.unregister(USERNAME)
```

### Get usernames for a DID

```ts
const usernames = await nameClient.getUsernames(DID_ADDRESS);
console.log(usernames)
```

### Get DID for a username

```ts
const USERNAME = 'johndoe.vda'

const did = await nameClient.getDid(USERNAME);
console.log(did)
```
