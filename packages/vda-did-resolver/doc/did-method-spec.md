# ETHR DID Method Specification

## Author

- Veramo core team: <https://github.com/uport-project/veramo/discussions> or veramo-hello@mesh.xyz

## Preface

The ethr DID method specification conforms to the requirements specified in
the [DID specification](https://w3c-ccg.github.io/did-core/), currently published by the W3C Credentials Community
Group. For more information about DIDs and DID method specifications, please see
the [DID Primer](https://github.com/WebOfTrustInfo/rebooting-the-web-of-trust-fall2017/blob/master/topics-and-advance-readings/did-primer.md)

## Abstract

Decentralized Identifiers (DIDs, see [1]) are designed to be compatible with any distributed ledger or network. In the
Ethereum community, a pattern known as ERC1056 (see [2]) utilizes a smart contract for a lightweight identifier management
system intended explicitly for off-chain usage.

The described DID method allows any Ethereum smart contract or key pair account, or any secp256k1 public key to become
a valid identifier. Such an identifier needs no registration. In case that key management or additional attributes such
as "service endpoints" are required, they are resolved using ERC1056 smart contracts deployed on the networks listed in the
[registry repository](https://github.com/uport-project/ethr-did-registry#contract-deployments).

Most networks use the default registry address: `0xdca7ef03e98e0dc2b855be647c39abe984fcf21b`.

Since each Ethereum transaction must be funded, there is a growing trend of on-chain transactions that are authenticated
via an externally created signature and not by the actual transaction originator. This allows for 3rd party funding
services, or for receivers to pay without any fundamental changes to the underlying Ethereum architecture. These kinds
of transactions have to be signed by an actual key pair and thus cannot be used to represent smart contract based
Ethereum accounts. ERC1056 proposes a way of a smart contract or regular key pair delegating signing for various
purposes to externally managed key pairs. This allows a smart contract to be represented, both on-chain and
off-chain or in payment channels through temporary or permanent delegates.

For a reference implementation of this DID method specification see [3].

### Identifier Controller

By default, each identifier is controlled by itself, or by its corresponding Ethereum address in case the identifier
is a public key. Each identifier can only be controlled by a single account at any given time. The controller can replace
themselves with any other Ethereum address, including contracts to allow more advanced models such as multi-signature
controllership.

## Target System

The target system is the Ethereum network where the ERC1056 is deployed. This could either be:

- Mainnet
- Ropsten
- Rinkeby
- Kovan
- other EVM-compliant blockchains such as private chains, side-chains, or consortium chains.

### Advantages

- No transaction fee for identifier creation
- Identifier creation is private
- Uses Ethereum's built-in account abstraction
- Supports multi-sig (or proxy) wallet for account controller
- Supports secp256k1 public keys as identifiers (on the same infrastructure)  
- Decoupling claims data from the underlying identifier
- Supports decoupling Ethereum interaction from the underlying identifier
- Flexibility to use key management
- Flexibility to allow third-party funding service to pay the gas fee if needed (meta-transactions)
- Supports any EVM-compliant blockchain
- Supports verifiable versioning

## JSON-LD Context Definition

Since this DID method still supports `publicKeyHex` and `publicKeyBase64` encodings for verification methods, it
requires a valid JSON-LD context for those entries.
To enable JSON-LD processing, the `@context` used when constructing DID documents for `did:ethr` should be:

```javascript
"@context": [
  "https://www.w3.org/ns/did/v1",
  "https://identity.foundation/EcdsaSecp256k1RecoverySignature2020/lds-ecdsa-secp256k1-recovery2020-0.0.jsonld"
]
```

You will also need this `@context` if you need to use `EcdsaSecp256k1RecoveryMethod2020` in your apps.

## DID Method Name

The namestring that shall identify this DID method is: `ethr`

A DID that uses this method MUST begin with the following prefix: `did:ethr`. Per the DID specification, this string
MUST be in lowercase. The remainder of the DID, after the prefix, is specified below.

## Method Specific Identifier

The method specific identifier is represented as the HEX-encoded secp256k1 public key (in compressed form),
or the corresponding HEX-encoded Ethereum address on the target network, prefixed with `0x`.

    ethr-did = "did:ethr:" ethr-specific-identifier
    ethr-specific-identifier = [ ethr-network ":" ] ethereum-address / public-key-hex
    ethr-network = "mainnet" / "ropsten" / "rinkeby" / "kovan" / network-chain-id
    network-chain-id = "0x" *HEXDIG
    ethereum-address = "0x" 40*HEXDIG
    public-key-hex = "0x" 66*HEXDIG

The `ethereum-address` or `public-key-hex` are case-insensitive, however, the corresponding `blockchainAccountId`
MAY be represented using the [mixed case checksum representation described in EIP55](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-55.md)
in the resulting DID document.

Note, if no public Ethereum network was specified, it is assumed that the DID is anchored on the Ethereum mainnet by
default. This means the following DIDs will resolve to equivalent DID Documents:

    did:ethr:mainnet:0xb9c5714089478a327f09197987f16f9e5d936e8a
    did:ethr:0x1:0xb9c5714089478a327f09197987f16f9e5d936e8a
    did:ethr:0xb9c5714089478a327f09197987f16f9e5d936e8a

If the identifier is a `public-key-hex`:

- it MUST be represented in compressed form (see https://en.bitcoin.it/wiki/Secp256k1)
- the corresponding `blockchainAccountId` entry is also added to the default DID document, unless the `owner` property
  has been changed to a different address.
- all Read, Update, and Delete operations MUST be made using the corresponding `blockchainAccountId` and MUST originate
  from the correct controller account (ECR1056 `owner`).

## Relationship to ERC1056

The subject of a `did:ethr` is mapped to an `identity` Ethereum address in the ERC1056 contract. When dealing with public
key identifiers, the Ethereum address corresponding to that public key is used to represent the controller.

The controller address of a `did:ethr` is mapped to the `owner` of an `identity` in the ERC1056.
The controller address is not listed as the [DID `controller`](https://www.w3.org/TR/did-core/#did-controller) property
in the DID document. This is intentional, to simplify the verification burden required by the DID spec.
Rather, this address it is a concept specific to ERC1056 and defines the address that is allowed to perform Update and 
Delete operations on the registry on behalf of the `identity` address.
This address MUST be listed with the ID `${did}#controller` in the `verificationMethod` section and also referenced
in all other verification relationships listed in the DID document.
In addition to this, if the identifier is a public key, this public key MUST be listed with the ID `${did}#controllerKey`
in all locations where `#controller` appears.

## CRUD Operation Definitions

### Create (Register)

In order to create a `ethr` DID, an Ethereum address, i.e., key pair, needs to be generated. At this point, no
interaction with the target Ethereum network is required. The registration is implicit as it is impossible to brute
force an Ethereum address, i.e., guessing the private key for a given public key on the Koblitz Curve
(secp256k1). The holder of the private key is the entity identified by the DID.

The default DID document for an `did:ethr<Ethereum address>` on mainnet, e.g.
`did:ethr:0xf3beac30c498d9e26865f34fcaa57dbb935b0d74` with no transactions to the ERC1056 registry looks like this:

```json
{
  "@context": [
    "https://www.w3.org/ns/did/v1",
    "https://identity.foundation/EcdsaSecp256k1RecoverySignature2020/lds-ecdsa-secp256k1-recovery2020-0.0.jsonld"
  ],
  "id": "did:ethr:0xb9c5714089478a327f09197987f16f9e5d936e8a",
  "verificationMethod": [
    {
      "id": "did:ethr:0xb9c5714089478a327f09197987f16f9e5d936e8a#controller",
      "type": "EcdsaSecp256k1RecoveryMethod2020",
      "controller": "did:ethr:0xb9c5714089478a327f09197987f16f9e5d936e8a",
      "blockchainAccountId": "0xb9c5714089478a327f09197987f16f9e5d936e8a@eip155:1"
    }
  ],
  "authentication": ["did:ethr:0xb9c5714089478a327f09197987f16f9e5d936e8a#controller"],
  "assertionMethod": ["did:ethr:0xb9c5714089478a327f09197987f16f9e5d936e8a#controller"]
}
```

The minimal DID Document for a `did:ethr:<public key>` where there are no corresponding TXs to the ERC1056 registry
looks like this:

```json
{
  "@context": [
    "https://www.w3.org/ns/did/v1",
    "https://identity.foundation/EcdsaSecp256k1RecoverySignature2020/lds-ecdsa-secp256k1-recovery2020-0.0.jsonld"
  ],
  "id": "did:ethr:0x0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798",
  "verificationMethod": [
    {
      "id": "did:ethr:0x0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798#controller",
      "type": "EcdsaSecp256k1RecoveryMethod2020",
      "controller": "did:ethr:0x0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798",
      "blockchainAccountId": "0xb9c5714089478a327f09197987f16f9e5d936e8a@eip155:1"
    },
    {
      "id": "did:ethr:0x0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798#controllerKey",
      "type": "EcdsaSecp256k1VerificationKey2019",
      "controller": "did:ethr:0x0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798",
      "publicKeyHex": "0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798"
    }
  ],
  "authentication": [
    "did:ethr:0x0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798#controller",
    "did:ethr:0x0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798#controllerKey"
  ],
  "assertionMethod": [
    "did:ethr:0x0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798#controller",
    "did:ethr:0x0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798#controllerKey"
  ]
}
```

### Read (Resolve)

The DID document is built by using read only functions and contract events on the ERC1056 registry.

Any value from the registry that returns an Ethereum address will be added to the `verificationMethod` array of the
DID document with type `EcdsaSecp256k1RecoveryMethod2020` and an `blockchainAccountId` attribute containing the address.
Other verification relationships and service entries are added or removed by enumerating contract events (see below).

#### Controller Address

Each identifier always has a controller address. By default, it is the same as the identifier address, but the resolver
must check the read only contract function `identityOwner(address identity)` on the deployed ERC1056 contract.

This controller address must be represented in the DID document as a `verificationMethod` entry with the `id` set as the
DID being resolved and with the fragment `#controller` appended to it.
A reference to it must also be added to the `authentication` and `assertionMethod` arrays of the DID document.

#### Enumerating Contract Events to build the DID Document

The ERC1056 contract publishes three types of events for each identifier.

- `DIDOwnerChanged` (indicating a change of `controller`)
- `DIDDelegateChanged`
- `DIDAttributeChanged`

If a change has ever been made for the Ethereum address of an identifier the block number is stored in the
`changed` mapping of the contract.

The latest event can be efficiently looked up by checking for one of the 3 above events at that exact block.

Each ERC1056 event contains a `previousChange` value which contains the block number of the previous change (if any).

To see all changes in history for an address use the following pseudo-code:

1. eth_call `changed(address identity)` on the ERC1056 contract to get the latest block where a change occurred.
2. If result is `null` return.
3. Filter for events for all the above types with the contracts address on the specified block.
4. If event has a previous change then go to 3

After building the history of events for an address, interpret each event to build the DID document like so: 

##### Controller changes (`DIDOwnerChanged`)

When the controller address of a `did:ethr` is changed, a `DIDOwnerChanged` event is emitted.

```solidity
event DIDOwnerChanged(
  address indexed identity,
  address owner,
  uint previousChange
);
```

The event data MUST be used to update the `#controller` entry in the `verificationMethod` array.
When resolving DIDs with publicKey identifiers, if the controller (`owner`) address is different from the corresponding 
address of the publicKey, then the `#controllerKey` entry in the `verificationMethod` array MUST be omitted.  

##### Delegate Keys (`DIDDelegateChanged`)

Delegate keys are Ethereum addresses that can either be general signing keys or optionally also perform authentication.

They are also verifiable from Solidity (on-chain).

When a delegate is added or revoked, a `DIDDelegateChanged` event is published that MUST be used to update the DID
document.

```solidity
event DIDDelegateChanged(
  address indexed identity,
  bytes32 delegateType,
  address delegate,
  uint validTo,
  uint previousChange
);
```

The only 2 `delegateTypes` that are currently published in the DID document are:

- `veriKey` which adds a `EcdsaSecp256k1RecoveryMethod2020` to the `verificationMethod` section of the DID document with
  the `blockchainAccountId`(`ethereumAddress`) of the delegate.
- `sigAuth` which adds a `EcdsaSecp256k1RecoveryMethod2020` to the `verificationMethod` section of document and a
  corresponding entry to the `authentication` section.

Note, the `delegateType` is a `bytes32` type for Ethereum gas efficiency reasons and not a `string`. This restricts us
to 32 bytes, which is why we use the short-hand versions above.

Only events with a `validTo` (measured in seconds) greater or equal to the current time should be included in the DID
document. When resolving an older version (using `versionId` in the didURL query string), the `validTo` entry MUST be
compared to the timestamp of the block of `versionId` height.

Such valid delegates MUST be added to the `verificationMethod` array as `EcdsaSecp256k1RecoveryMethod2020` entries, with
`delegate` listed under `blockchainAccountId` and suffixed with `@eip155:<chainId>`

Example:
```json
{
  "id": "did:ethr:0xf3beac30c498d9e26865f34fcaa57dbb935b0d74#delegate-1",
  "type": "EcdsaSecp256k1RecoveryMethod2020",
  "controller": "did:ethr:0xf3beac30c498d9e26865f34fcaa57dbb935b0d74",
  "blockchainAccountId": "0x12345678c498d9e26865f34fcaa57dbb935b0d74@eip155:1"
}
```

##### Non-Ethereum Attributes (`DIDAttributeChanged`)

Non-Ethereum keys, service endpoints etc. can be added using attributes. Attributes only exist on the blockchain as
contract events of type `DIDAttributeChanged` and can thus not be queried from within solidity code.

```solidity
event DIDAttributeChanged(
  address indexed identity,
  bytes32 name,
  bytes value,
  uint validTo,
  uint previousChange
);
```

Note, the name is a `bytes32` type for Ethereum gas efficiency reasons and not a `string`. This restricts us to 32
bytes, which is why we use the short-hand attribute versions explained below.

While any attribute can be stored, for the DID document we currently support adding to each of these sections of the DID
document:

- Public Keys (Verification Methods)
- Service Endpoints

###### Public Keys

The name of the attribute added to ERC1056 should follow this format:
`did/pub/(Secp256k1|RSA|Ed25519|X25519)/(veriKey|sigAuth|enc)/(hex|base64|base58)`

(Essentially `did/pub/<key algorithm>/<key purpose>/<encoding>`)
Please opt for the `base58` encoding since the other encodings are not spec compliant and will be removed in future
versions of the spec and reference resolver.

###### Key purposes

- `veriKey` adds a verification key to the `verificationMethod` section of document
- `sigAuth` adds a verification key to the `verificationMethod` section of document and adds an entry to the
  `authentication` section of document.
- `enc` adds a key agreement key to the `verificationMethod` section and a corresponding entry to the `keyAgreement` section.
  This is used to perform a Diffie-Hellman key exchange and derive a secret key for encrypting messages to the DID that
  lists such a key.

> **Note** The `<encoding>` only refers to the key encoding in the resolved DID document.
> Attribute values sent to the ERC1056 registry should always be hex encodings of the raw public key data.

###### Example Hex encoded Secp256k1 Verification Key

A `DIDAttributeChanged` event for the account `0xf3beac30c498d9e26865f34fcaa57dbb935b0d74` with the name
`did/pub/Secp256k1/veriKey/hex` and the value of `0x02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71`
generates a public key entry like the following:

```json
{
  "id": "did:ethr:0xf3beac30c498d9e26865f34fcaa57dbb935b0d74#delegate-1",
  "type": "EcdsaSecp256k1VerificationKey2019",
  "controller": "did:ethr:0xf3beac30c498d9e26865f34fcaa57dbb935b0d74",
  "publicKeyHex": "02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71"
}
```

###### Example Base58 encoded Ed25519 Verification Key

A `DIDAttributeChanged` event for the account `0xf3beac30c498d9e26865f34fcaa57dbb935b0d74` with the name
`did/pub/Ed25519/veriKey/base58` and the value of `0xb97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71`
generates a public key entry like this:

```json
{
  "id": "did:ethr:0xf3beac30c498d9e26865f34fcaa57dbb935b0d74#delegate-1",
  "type": "Ed25519VerificationKey2018",
  "controller": "did:ethr:0xf3beac30c498d9e26865f34fcaa57dbb935b0d74",
  "publicKeyBase58": "DV4G2kpBKjE6zxKor7Cj21iL9x9qyXb6emqjszBXcuhz"
}
```

###### Example Base64 encoded X25519 Encryption Key

A `DIDAttributeChanged` event for the account `0xf3beac30c498d9e26865f34fcaa57dbb935b0d74` with the name
`did/pub/X25519/enc/base64` and the value of
`0x302a300506032b656e032100118557777ffb078774371a52b00fed75561dcf975e61c47553e664a617661052`
generates a public key entry like this:

```json
{
  "id": "did:ethr:0xf3beac30c498d9e26865f34fcaa57dbb935b0d74#delegate-1",
  "type": "X25519KeyAgreementKey2019",
  "controller": "did:ethr:0xf3beac30c498d9e26865f34fcaa57dbb935b0d74",
  "publicKeyBase64": "MCowBQYDK2VuAyEAEYVXd3/7B4d0NxpSsA/tdVYdz5deYcR1U+ZkphdmEFI="
}
```

###### Service Endpoints

The name of the attribute should follow this format:

`did/svc/[ServiceName]`

Example:

A `DIDAttributeChanged` event for the account `0xf3beac30c498d9e26865f34fcaa57dbb935b0d74` with the name
`did/svc/HubService` and value of the URL `https://hubs.uport.me` hex encoded as
`0x68747470733a2f2f687562732e75706f72742e6d65` generates a service endpoint entry like the following:

```json
{
  "id": "did:ethr:0xf3beac30c498d9e26865f34fcaa57dbb935b0d74#service-1",
  "type": "HubService",
  "serviceEndpoint": "https://hubs.uport.me"
}
```

#### `id` properties of entries

With the exception of `#controller` and `#controllerKey`, the `id` properties that appear throughout the DID document
MUST be stable across updates. This means that the same key material will be referenced by the same ID after an update.

* Attribute or delegate changes that result in `verificationMethod` entries MUST set the `id`
`${did}#delegate-${eventIndex}`.
* Attributes that result in `service` entries MUST set the `id` to `${did}#service-${eventIndex}`

where `eventIndex` is the index of the event that modifies that section of the DID document.

**Example**

* add key => `#delegate-1` is added
* add another key => `#delegate-2` is added
* add delegate => `#delegate-3` is added
* add service => `#service-1` ia added
* revoke first key => `#delegate-1` gets removed from the DID document; `#delegate-2` and `#delegte-3` remain.
* add another delegate => `#delegate-5` is added (earlier revocation is counted as an event)
* first delegate expires => `delegate-3` is removed, `#delegate-5` remains intact

### Update

The DID Document may be updated by invoking the relevant smart contract functions as defined by the ERC1056 standard.
This includes changes to the account owner, adding delegates and adding additional attributes. Please find a detailed
description in the [ERC1056 documentation](https://github.com/ethereum/EIPs/issues/1056).

These functions will trigger the respective Ethereum events which are used to build the DID Document for a given
account as described
in [Enumerating Contract Events to build the DID Document](#Enumerating-Contract-Events-to-build-the-DID-Document).

Some elements of the DID Document will be revoked automatically when their validity period expires. This includes the
delegates and additional attributes. Please find a detailed description in the
[ERC1056 documentation](https://github.com/ethereum/EIPs/issues/1056). All attribute and delegate functions will trigger
the respective Ethereum events which are used to build the DID Document for a given identifier as described
in [Enumerating Contract Events to build the DID Document](#Enumerating-Contract-Events-to-build-the-DID-Document).

### Delete (Revoke)

Two cases need to be distinguished:

- In case no changes were written to ERC1056, nothing needs to be done, and the private key which belongs to the
  Ethereum address needs to be deleted from the storage medium used to protect the keys, e.g., mobile device.
- In case ERC1056 was utilized, the owner of the smart contract needs to be set to `0x0`. Although, `0x0`is a valid
  Ethereum address, this will indicate the account has no owner which is a common approach for invalidation, e.g.,
  tokens. To detect if the `owner` is the null address, one must get the logs of the last change to the account and
  inspect if the `owner` was set to the null address (`0x0000000000000000000000000000000000000000`). It is impossible
  to make any other changes to the DID document after such a change, therefore all preexisting keys and services are
  considered revoked.
  
If the intention is to revoke all the signatures corresponding to the DID, the second option MUST be used.

The DID resolution result for a deactivated DID has the following shape:

```json
{
  "didDocumentMetadata": {
    "deactivated": true
  },
  "didResolutionMetadata": {
    "contentType": "application/did+ld+json"
  },
  "didDocument": {
    "@context": "https://www.w3.org/ns/did/v1",
    "id": "<the deactivated DID>",
    "verificationMethod": [],
    "authentication": []
  }
}
```

## Metadata

The `resolve` method returns an object with the following properties: `didDocument`, `didDocumentMetadata`,
`didResolutionMetadata`.

### DID Document Metadata

When resolving a DID document that has had updates, the latest update MUST be listed in the `didDocumentMetadata`.
* `versionId` MUST be the block number of the latest update.
* `updated` MUST be the ISO date string of the block time of the latest update (without sub-second resolution).

Example:
```json
{
  "didDocumentMetadata": {
    "versionId": "12090175",
    "updated": "2021-03-22T18:14:29Z"
  }
}
```

### DID Resolution Metadata

```json
{
  "didResolutionMetadata": {
    "contentType": "application/did+ld+json"
  }
}
```

## Resolving DID URIs with query parameters.

### `versionId` query string parameter

This DID method supports resolving previous versions of the DID document by specifying a `versionId` parameter.

Example: `did:ethr:0x26bf14321004e770e7a8b080b7a526d8eed8b388?versionId=12090175`

The `versionId` is the block number at which the DID resolution MUST be performed.
Only ERC1056 events prior to or contained in this block number are to be considered when building the event history.

If there are any events after that block that mutate the DID, the earliest of them SHOULD be used to populate the
properties of the `didDocumentMetadata`:
* `nextVersionId` MUST be the block number of the next update to the DID document.
* `nextUpdate` MUST be the ISO date string of the block time of the next update (without sub-second resolution).

In case the DID has had updates prior to or included in the `versionId` block number, the `updated` and `versionId`
properties of the `didDocumentMetadata` MUST correspond to the latest block prior to the `versionId` query string param.

Any timestamp comparisons of `validTo` fields of the event history MUST be done against the `versionId` block timestamp.

Example:
`?versionId=12101682`
```json
{
  "didDocumentMetadata": {
    "versionId": "12090175",
    "updated": "2021-03-22T18:14:29Z",
    "nextVersionId": "12276565",
    "nextUpdate": "2021-04-20T10:48:42Z"
  }
}
```

#### Security considerations of DID versioning

Applications must take precautions when using versioned DID URIs.
If a key is compromised and revoked then it can still be used to issue signatures on behalf of the "older" DID URI.
The use of versioned DID URIs is only recommended in some limited situations where the timestamp of signatures can also
be verified, where malicious signatures can be easily revoked, and where applications can afford to check for these
explicit revocations of either keys or signatures.
Wherever versioned DIDs are in use, it SHOULD be made obvious to users that they are dealing with potentially revoked data.

### `initial-state` query string parameter

TBD

## Reference Implementations

The code at [https://github.com/decentralized-identity/ethr-did-resolver]() is intended to present a reference
implementation of this DID method.

## References

**[1]** <https://w3c-ccg.github.io/did-core/>

**[2]** <https://github.com/ethereum/EIPs/issues/1056>

**[3]** <https://github.com/decentralized-identity/ethr-did-resolver>

**[4]** <https://github.com/uport-project/ethr-did-registry>
