
# VDA SBT Client

A client library for minting a Soulbound Token with the Verida SBT smart contract that guarantees a SBT is only issued once per unique ID per wallet.

The smart contract maintains a list of trusted signers that are permitted to sign data off-chain that the smart contract will then trust. If the smart contract can't verify the data is signed by a trusted signer, the SBT will not be minted.

# Installation

```
yarn add @verida/vda-sbt-client
```

## Usage

### Setup

```ts
import { VeridaSBTClient } from '@verida/vda-sbt-client'

// DID address that controls the proof of eligibility to mint the SBT
const DID_ADDRESS = '0x...'
// DID private key that controls the proof of eligibility to mint the SBT
const DID_PRIVATE_KEY = '0x...'
// Polygon private key that will fund blockchain transactions
const POLYGON_PRIVATE_KEY = '0x...'
// Polygon RPC URL (Mumbai testnet)
const RPC_URL = 'https://rpc-mumbai.maticvigil.com'

// Create SBT Client
const sbtClient = new VeridaSBTClient({
    identifier: DID_ADDRESS,
    signKey: DID_PRIVATE_KEY,
    chainNameOrId: "testnet" | "mainnet,
    privateKey: POLYGON_PRIVATE_KEY,
    rpcUrl: RPC_URL
})
```

### Mint Soulbound Token (SBT)

```ts
// Type of SBT to mint
const sbtType = 'twitter'
// Unique ID of the SBT to mint
const sbtId = '123456789'
// URI of the SBT metadata
const sbtURI = 'https://gateway.pinata.cloud/ipfs/....'
// Address claiming the SBT (ie: `0x...`)
const claimingDID = DID_ADDRESS
// Signature from a trusted signer (registered in the smart contract) signing
// the proof string: `${sbtType}${uniqueId}${sbtURI}`
const signedData = '0x...'
// Signature proving the signer of the data is controlled by the trusted DID
// @see https://developers.verida.network/docs/extensions/personal-data-bridge#signing-credit-score-data
const signedTrustProof = '0x...'

await blockchainApi.claimSBT(
    sbtType,
    sbtId,
    sbtURI,
    claimingDID,
    signedData,
    signedTrustProof                
)
```

### Check if a SBT has been claimed by any wallet

```ts
// Type of SBT to check
const sbtType = 'twitter'
// Unique ID of the SBT to check
const sbtId = '123456789'

const claimed = await blockchainApi.isSBTClaimed(sbtType, sbtId)
```

### Token info

```ts
// ID of the token to get info on
const tokenId = 1

const tokenInfo = await blockchainApi.tokenInfo(tokenId)
```

### Token URI

```ts
// ID of the token to fetch URI
const tokenId = 1

await blockchainApi.tokenURI(tokenId)
```

### Total number of issued SBT's

```ts
const total: number = await blockchainApi.totalSupply()
```

### Burn SBT

```ts
// ID of the token to burn
const tokenId = 1

await blockchainApi.burnSBT(tokenId)
```