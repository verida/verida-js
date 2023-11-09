
# VDA Node Manager
A client library for manage a storage node for a DID.

A DID can add only one storage node. Here shows the fields of `StorageNode` struct:
```ts
struct StorageNode {
    address didAddress;
    string endpointUri;
    string countryCode;
    string regionCode;
    uint datacenterId;
    int lat;
    int long;
    uint establishmentDate;
}
```
Here, `didAddress` and `endpointUri` are unique values. In turn, there are no duplicated values for these 2 fields.

## About Datacenter (Contract owner specific)
To add storage nodes, we need `datacenterId`. Adding `datacenter`s are specific to the owner of `StorageNodeContract`.
Before adding storage node, the contract owner should add `data centers`.

## Installation

```
yarn add @verida/vda-node-client
```

## Usage

This library can be run in 2 modes of `read only` and `read and write`.
In `read only` mode, it can fetch the `data center ids` and `storage nodes`.
`read and write` mode adds `adding storage node` feature to the `read only` mode.

### Read Only
Setup the library in `read only` mode:

```ts
import { VeridaNodeClient } from '@verida/vda-name-client'
import { EnvironmentType } from '@verida/types'

const nodeClient = new VeridaNodeClient({
    environment: EnvironmentType.TESTNET
})
```

#### Get datacenters
##### by datacenterIds
```ts
const datacenters = await nodeClient.getDataCenters([1, 2]);
console.log(datacenters);
```
##### by country code
```ts
const datacenters = await nodeClient.getDataCentersByCountry('au');
console.log(datacenters);
```
##### by region code
```ts
const datacenters = await nodeClient.getDataCentersByRegion('oceania');
console.log(datacenters);
```

#### Get storage nodes
##### by did address
```ts
const node = await nodeClient.getNodeByAddress(`0x14...5`);
console.log(node);
```
##### by endpoint
```ts
const node = await nodeClient.getNodeByEndpoint(`https://...`);
console.log(node);
```
##### by country code
```ts
const nodes = await nodeClient.getNodesByCountry(`au`);
console.log(nodes);
```
##### by region code
```ts
const nodes = await nodeClient.getNodesByRegion(`oceania`);
console.log(nodes);
```

### Read and Write
Setup the library in `read only` mode:

```ts
import { VeridaNodeClient } from '@verida/vda-name-client'
import { EnvironmentType } from '@verida/types'

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

const nodeClient = new VeridaNodeClient({
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

This mode support above get methods *and* add/remove storage nodes:

### Add a storage node
As there can only one Storage Node per a did, you can call `addNode()` function only once per `VeridaNodeClient` instance.
Once you removed the node completely, you can call `addNode()` function again.
```ts
const endpointUri = "https://...";
const countryCode = "au";
const regionCode = "oceania";
const datacenterId = 1; // datacenter ID can be fetched by `getDatacenter...()` functions
const lat = 27.01;
const long = 144.001;
const authSignature = "0x..."; // signature by a trusted signer. This comes from verida.

await nodeClient.addNode(
    endpointUri,
    countryCode,
    regionCode,
    datacenterId,
    lat,
    long,
    authSignature
);
```

### Get Node (additional feature)
In the `read and write` mode, you can call `getNodeByAddress()` function without parameters. In case, it fetchs the node of the `did` in the `VeridaNodeClient`.
#### Get node by address without parameter
```ts
const node = await nodeClient.getNodeByAddress();
console.log(node);
```

### Remove node start
`unregisterTime` should be more than 28 days later from calling point.
```ts
const currentTimeInSec = Math.floor(Date.now() / 1000);
const unregisterTime = currentTimeInSec + 30 * 24 * 60 * 60 // 30 days later from now

await nodeClient.removeNodeStart(unregisterTime);
```

### Remove node complete
`removeNodeComplete()` function should be called after the `unregisterTime`. Otherwise, it'd be rejected.
```ts
await nodeClient.removeNodeComplete();
```