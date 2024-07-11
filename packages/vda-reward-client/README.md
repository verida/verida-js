
# VDA Reward Client

A client library for claiming Verida Reward.

Users can claim the Verida token as reward for registered claim type such as Facebook, Twitter, and etc. Claim types are added and removed by the Verida team.

## Verida package dependency
This packages has dependency for following `verida-js` packages.
- `@verida/types`
- `@verida/vda-common`
- `@verida/vda-client-base`

Also, has a dependency for following `verida-js` packages for test.
- `@verida/vda-common-test`
- `@verida/vda-node-manager`
- `@verida/encryption-utils`

## Installation

```
yarn add @verida/vda-reward-client
```

## Usage

This library can be in `read only` mode where it just calls the `view` functions or in `read and write` mode where it can also call the `claim()` and `claimToStorage()` functions.

### Read Only

Setup the library in `read only` mode for reading usernames and DIDs:

```ts
import { VeridaRewardClient } from '@verida/vda-reward-client'
import { EnvironmentType } from '@verida/types'

// Create name Client
const rewardClient = new VeridaRewardClient({
    environment: EnvironmentType.TESTNET
})
```

#### Get claim type info

```ts
const claimTypeInfo = await rewardClient.getUsernames(`<claimType id>`);
console.log(usernames)
```

### Read and Write

In order to write to the blockchain, you will require a Polygon private key with `MATIC` tokens.

Setup the library in `read and write` mode to support the above get methods *and* claim reward:

```ts
import { VeridaRewardClient } from '@verida/vda-name-client'
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
const rewardClient = new VeridaRewardClient({
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

### Claim to an address

```ts
const claimTypeId = '<Claim type id>'; //ex: 'facebook'
const hash = '<Input credential>'; //ex: facebook id
const receiverAddress = '<Recipient wallet or contract address>';
const proof = '<Proof from Verida>';
await rewardClient.claim(claimeTypeId, hash, receiverAddress, proof)
```

### Claim to storage

```ts
const claimTypeId = '<Claim type id>'; //ex: 'facebook'
const hash = '<Input credential>'; //ex: facebook id
const didAddress = '<DID address that has a node in the `StorageNodeRegistry` contract>';
const proof = '<Proof from Verida>';

await rewardClient.claimToStorage(claimeTypeId, hash, proof, didAddress);
```

if `DIDAddress` of the `rewardClient` instance has a node in the `StorageNodeRegistry` contract and want to claim the rewards for the address, you can last parameter as following:
```ts
await rewardClient.claimToStorage(claimeTypeId, hash, proof);
```
