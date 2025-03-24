
# VDA XP Reward Client

A client library for claiming XP-Reward.

Users can claim the Verida token as reward for their XP. XP to reward conversion rate is set by the Verida team.

## Verida package dependency
This packages has dependency for following `verida-js` packages.
- `@verida/types`
- `@verida/vda-common`

Also, has a dependency for following `verida-js` packages for test.
- `@verida/vda-common-test`
- `@verida/encryption-utils`

## Installation

```
yarn add @verida/vda-xp-reward-client
```

## Usage

This library can be in `read only` mode where it just calls the `view` functions or in `read and write` mode where it can also call the `claimXPReward()`.

### Read Only

Setup the library in `read only` mode for reading usernames and DIDs:

```ts
import { VeridaXPRewardClient } from '@verida/vda-xp-reward-client'
import { EnvironmentType } from '@verida/types'

// Create name Client
const xpRewardClient = new VeridaXPRewardClient({
    network: EnvironmentType.TESTNET
})
```

#### Get conversion rate

```ts
const rate = await xpRewardClient.getConversionRate();
```

### Read and Write

In order to write to the blockchain, you will require a Polygon private key with `MATIC` tokens.

Setup the library in `read and write` mode to support the above get methods *and* claim reward:

```ts
import { VeridaXPRewardClient } from '@verida/vda-name-client'
import { EnvironmentType, Web3CallType } from '@verida/types'

// DID address that controls the proof of eligibility
const DID_ADDRESS = '0x...'
// DID private key that controls the proof of eligibility
const DID_PRIVATE_KEY = '0x...'
// Polygon private key that will fund blockchain transactions
const POLYGON_PRIVATE_KEY = '0x...'
// How to make blockchain requests. This should be 'web3' unless using Verida's meta transaction server.
const CALL_TYPE = 'web3'
// (Optional) Polygon RPC URL (Mumbai testnet)
const RPC_URL = 'https://rpc-mumbai.maticvigil.com'

// Create name Client
const xpRewardClient = new VeridaXPRewardClient({
    network: EnvironmentType.TESTNET
    callType: CALL_TYPE,
    did: `did:vda:testnet:${DID_ADDRESS}`,
    signKey: DID_PRIVATE_KEY,
    web3Options: {
        rpcUrl: RPC_URL,
        privateKey: POLYGON_PRIVATE_KEY
    }
})
```

### Claim

```ts
const claimData = 
[
    {
        typeId: `type-1`,
        uniqueId: ``, // Optional
        issueYear: 2024,
        issueMonth: 4,
        xp: 100,
        signature: `${<proof from Verida trusted signers>}`
    },
    {...},
    {...}
]
const recipient = '0x...'; //Recipient wallet addresss
await xpRewardClient.claimXPReward(recipient, claimData);
```