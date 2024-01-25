# VDA Node Manager
A client library for manage a storage node for a DID.

A DID can add only one storage node. Here shows the fields of `StorageNode` struct:
```ts
struct StorageNode {
    string name;
    address didAddress;
    string endpointUri;
    string countryCode;
    string regionCode;
    uint datacenterId;
    int lat;
    int long;
    uint slotCount;
    bool acceptFallbackSlots;
}
```
Here, `name`, `didAddress` and `endpointUri` are unique values. In turn, there are no duplicated values for these fields.

## About Datacenter (Contract owner specific)
To add storage nodes, we need `datacenterId`. Adding `datacenter`s are specific to the owner of `StorageNodeContract`.
Before adding any storage node, the contract owner should add `data center`s.

## Installation

```
yarn add @verida/vda-node-manager
```

## Usage

This library can be run in 2 modes of `read only` and `read and write`.
In `read only` mode, it can fetch the `data center ids` and `storage nodes`.
`read and write` mode adds `adding storage node` feature to the `read only` mode.

### Read Only
Setup the library in `read only` mode:

```ts
import { VeridaNodeManager } from '@verida/vda-node-manager'
import { EnvironmentType, EnumStatus } from '@verida/types'

const nodeClient = new VeridaNodeManager({
    environment: EnvironmentType.TESTNET
})
```

#### Get datacenters
##### by datacenter names
```ts
const datacenters = await nodeClient.getDataCentersByName(['center-1', 'center-2']);
console.log(datacenters);
```
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
##### by name
```ts
const node = await nodeClient.getNodeByName(`node-1`);
console.log(node);
```

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

const nodes = await nodeClient.getNodesByCountry(`au`, EnumStatus.active);
console.log(nodes);
```
##### by region code
```ts
const nodes = await nodeClient.getNodesByRegion(`oceania`);
console.log(nodes);

const nodes = await nodeClient.getNodesByRegion(`oceania`, EnumStatus.active);
console.log(nodes);
```

### Read and Write
Setup the library in `read only` mode:

```ts
import { VeridaNodeManager } from '@verida/vda-node-manager'
import { EnvironmentType, EnumStatus } from '@verida/types'

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

const nodeManager = new VeridaNodeManager({
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
As there can only one Storage Node per a did, you can call `addNode()` function only once per `VeridaNodeManager` instance.
Once you removed the node completely, you can call `addNode()` function again.
```ts
const name = "node-1";
const endpointUri = "https://...";
const countryCode = "au";
const regionCode = "oceania";
const datacenterId = 1; // datacenter ID can be fetched by `getDatacenter...()` functions
const lat = 27.01;
const long = 144.001;
const slotCount = BigNumber.from(20000);
const acceptFallbackSlots = false;
const authSignature = "0x..."; // signature by a trusted signer. This comes from verida.

await nodeManager.addNode(
    name,
    endpointUri,
    countryCode,
    regionCode,
    datacenterId,
    lat,
    long,
    slotCount,
    acceptFallbackSlots,
    authSignature
);
```

### Get Node (additional feature)
In the `read and write` mode, you can call `getNodeByAddress()` function without parameters. In case, it fetchs the node of the `did` in the `VeridaNodeManager`.
#### Get node by address without parameter
```ts
const node = await nodeManager.getNodeByAddress();
console.log(node);
```

### Remove node start
`unregisterTime` should be more than 28 days later from calling point.
To remove a node, it should point a fall-back node for data migration.
```ts
const fallbackInfo = {
    fallbackNodeAddress: '0x...',
    availableSlots: 20000,
    fallbackProofTime: Math.floor(Date.now() / 1000),
    availableSlotsProof: '0x...'
}
const currentTimeInSec = Math.floor(Date.now() / 1000);
const unregisterTime = currentTimeInSec + 30 * 24 * 60 * 60 // 30 days later from now

await nodeManager.removeNodeStart(unregisterTime, fallbackInfo);
```

### Remove node complete
`removeNodeComplete()` function should be called after the `unregisterTime`. Otherwise, it'd be rejected.
Also, this function requires fallback migration proof that is signed by the fall back node.
```ts
const fallbackMigrationProof = '0x...';
await nodeManager.removeNodeComplete(fallbackMigrationProof);
```

## Test
There are 3 test files in the `test` directory
```
owner.test.ts
user_read.test.ts
user_write.test.ts
```
### Owner feature test
You can test owner specific features by following command:
```
yarn test test/owner.test.ts
```
### Read-only functions test
You can test read-only functions by following command:
```
yarn test test/user_read.test.ts
```
### Read-write functions test
You can test all functions by following command:
```
yarn test test/user_write.test.ts
```
#### **_Caution_**
To check the `depositToken()` function, transaction sender address should own more than 5000 tokens and approve it to the `StorageNodeRegistry` contract.

Also to check the `depositTokenFromProvider()` function, the provider own more than 5000 tokens and approve it to the `StorageNodeRegistry` contract.