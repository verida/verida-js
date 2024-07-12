
# VDA Token Client

A client library to managet Verida Tokens

## Dependencies
This package dependes on the following `verida-js` packages:
- `@verida/types`
- `@verida/helpers`
- `@verida/vda-common`
- `@verida/vda-web3`

And dependes on the following packages for test:
- `@verida/vda-common-test`

## Installation

```
yarn add @verida/vda-token-client
```

## Usage

There are 2 classes of `VeridaTokenClient` and `VeridaTokenOwner`.<br/>
- `VeridaTokenClient` is for general users to mange VDA tokens.
- `VeridaTokenOwner` adds the owner-specific functions to the `VeridaTokenClient`.

These classes can be run in 2 modes of __*read-only*__ and __*read & write*__.<br/>
If you provided `privateKey` field in the configuration while creating the instance, it runs in __*read & write*__ mode, otherwise it runs in __*read-only*__ mode.

In the __*read-only*__ mode, it can calls only the `view` functions of the contract.

### Read Only

Setup the library in `read only`:

```ts
import { VeridaTokenClient } from '@verida/vda-token-client'
import { BlockchainAnchor } from '@verida/types'

// Create token Client
const blockchainAnchor = BlockchainAnchor.POLAMOY;
const rpcUrl = `<Your rpc url>`; // This is optional
const tokenClient = await VeridaTokenClient.CreateAsync({
    blockchainAnchor,
    rpcUrl
})
```

#### *Example:*  Get total supply

```ts
const value:BigNumber = await tokenClient.totalSupply();
```

### Read and Write

```ts
import { VeridaTokenClient } from '@verida/vda-token-client'
import { BlockchainAnchor } from '@verida/types'

const blockchainAnchor = BlockchainAnchor.POLAMOY;
const rpcUrl = `<Your rpc url>`; // This is optional
const privateKey = `<Input your wallet private key>`;
const tokenClient = await VeridaTokenClient.CreateAsync({
    blockchainAnchor,
    privateKey,
    rpcUrl
})
```

#### *Example:* Transfer token

```ts
const to = `0x...`; // Recipient address
const amount = BigNumber.from(10);
await tokenClient.transfer(to, amount);
```
