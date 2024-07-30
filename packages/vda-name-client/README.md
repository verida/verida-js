
# VDA Name Client

A client library for registering / unregistering a human readable username alias for a DID.

DID's can have multiple usernames (although the smart contract currently limits to just `1`)

## Dependencies
This package dependes on the following `verida-js` packages:
- `@verida/types`
- `@verida/vda-common`
- `@verida/helpers`
- `@verida/vda-client-base`

And dependes on the following packages for test:
- `@verida/vda-common-test`

## Installation

```
yarn add @verida/vda-name-client
```

## Usage

This library can be in `read only` mode where it just fetches DID's and usernames or in `read and write` mode where it can also register / unregister usernames.

### Read Only

Setup the library in `read only` mode for reading usernames and DIDs:

```ts
import { VeridaNameClient } from '@verida/vda-name-client'
import { EnvironmentType } from '@verida/types'

// Create name Client
const nameClient = new VeridaNameClient({
    environment: EnvironmentType.TESTNET
})
```

#### Get usernames for a DID

```ts
const usernames = await nameClient.getUsernames(DID_ADDRESS);
console.log(usernames)
```

#### Get DID for a username

```ts
const USERNAME = 'johndoe.vda'

const did = await nameClient.getDid(USERNAME);
console.log(did)
```

### Read and Write

In order to write to the blockchain, you will require a Polygon private key with `MATIC` tokens.

Setup the library in `read and write` mode to support the above get methods *and* register / unregister usernames:

```ts
import { VeridaNameClient } from '@verida/vda-name-client'
import { EnvironmentType, Web3CallType } from '@verida/types'

// DID address that controls the proof of eligibility to mint the SBT
const DID_ADDRESS = '0x...'
// DID private key that controls the proof of eligibility to mint the SBT
const DID_PRIVATE_KEY = '0x...'
// Polygon private key that will fund blockchain transactions
const POLYGON_PRIVATE_KEY = '0x...'
// How to make blockchain requests. This should be 'web3' unless using Verida's meta transaction server.
const CALL_TYPE = 'web3'
// (Optional) Polygon RPC URL (Mumbai testnet)
const RPC_URL = 'https://rpc-mumbai.maticvigil.com'

// Create name Client
const nameClient = new VeridaNameClient({
    environment: EnvironmentType.TESTNET
    callType: CALL_TYPE,
    did: DID_ADDRESS,
    signKey: DID_PRIVATE_KEY,
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
