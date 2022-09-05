# Getting Started

## Construct a New Identity

### Create Ethr-DID from scratch

Creating an Ethr-DID is analogous to creating an Ethereum account, which is an address on the Ethereum blockchain
controlled by a key pair. Your Ethr-DID will be your key pair.

We provide a convenient method to easily create one `EthrDID.createKeyPair()` which returns an object containing an
Ethereum address and private key.

```ts
import { EthrDID } from 'ethr-did'

const keypair = EthrDID.createKeyPair()
const ethrDid = new EthrDID({...keypair})
// this creates a DID like:
// did:ethr:0x02ac49094591d32a4e2f93f3368da2d7d827e987ce6cdb3bd3b8a3390fde8fc33b
```

This represents a DID that is based on a secp256k1 key pair (ethereum key pair) and that is anchored on the Ethereum
`mainnet`. As you may have noticed, no transaction was necessary to anchor the DID. This is by design and it is possible
because by default all EthrDIDs resolve to their own public key or ethereum address. Later on we will see how to update
a DID document, in which case a transaction will be needed.

To create a DID that is anchored on a different network, you must specify a `chainNameOrId` property.

```ts
let chainNameOrId = 'rinkeby' // you can use the network name for the most popular [test] networks.
const ethrDidOnRinkeby = new EthrDID({...keypair, chainNameOrId})
// did:ethr:rinkeby:0x02ac49094591d32a4e2f93f3368da2d7d827e987ce6cdb3bd3b8a3390fde8fc33b

chainNameOrId = 5 // goerli chain ID
const ethrDidOnGoerli = new EthrDID({...keypair, chainNameOrId})
// did:ethr:0x5:0x02ac49094591d32a4e2f93f3368da2d7d827e987ce6cdb3bd3b8a3390fde8fc33b
```

### Use Existing Web3 Provider

If you use a built-in web3 provider like metamask you can use one of your metamask addresses as your identifier.

```js
const provider = new Web3Provider((window as any).ethereum);
const chainNameOrId = (await provider.getNetwork()).chainId
const accounts = await provider.listAccounts()

const ethrDid = new EthrDID({identifier: accounts[0], provider, chainNameOrId})
```

Unfortunately, web3 providers are not directly able to sign data in a way that is compliant with the
JWT [ES256K](https://datatracker.ietf.org/doc/html/rfc8812#section-3.2) or the (unregistered) `ES256K-R` algorithms.
This is a requirement for exchanging verifiable off-chain data, so you will need to add a key pair as a delegate or as
an attribute to be able to sign JWTs.

You can quickly add one like this:

```js
const { kp, txHash } = await ethrDid.createSigningDelegate() // Adds a signing delegate valid for 1 day
```

This will allow you to use the web3 based EthrDID to sign JWTs using the (unregistered) `ES256K-R` algorithm. To support
other algorithms, please check out the section on adding attributes below.

#### Note

You don't have to use one of the accounts of the web3 provider, it's ok to use key-pair accounts even in a web3 context.
A [`Provider`](https://docs.ethers.io/v5/api/providers/#providers) that links to the corresponding `chainNameOrId` is
needed if you wish to make updates to the DID document. You can also use a `rpcUrl` instead, and a `JsonRPCProvider`
will be created internally. See the section on managing keys below. If you are not using a `Provider` that can sign on
behalf of the `owner` address but still want to update the DID document, you need to supply a corresponding `txSigner`
or `privateKey` to the constructor.

### Resolving the DID document

To inspect the corresponding DID document for the DID you just created you can use
the [`ethr-did-resolver`](https://github.com/decentralized-identity/ethr-did-resolver) library. This document is used by
verifiers to check that the signatures issued by your DID match the keys listed for it.

```ts
import { Resolver } from 'did-resolver'
import { getResolver } from 'ethr-did-resolver'

const rpcUrl = "https://rinkeby.infura.io/v3/<get a project ID from infura.io>";
const didResolver = new Resolver(getResolver({ rpcUrl, name: "rinkeby" }));

const didDocument = (await didResolver.resolve(ethrDidOnRinkeby.did)).didDocument

/**
 {
  "@context": [
    "https://www.w3.org/ns/did/v1",
    "https://identity.foundation/EcdsaSecp256k1RecoverySignature2020/lds-ecdsa-secp256k1-recovery2020-0.0.jsonld"
  ],
  "id": "did:ethr:rinkeby:0x02ac49094591d32a4e2f93f3368da2d7d827e987ce6cdb3bd3b8a3390fde8fc33b",
  "verificationMethod": [
    {
      "id": "did:ethr:rinkeby:0x02ac49094591d32a4e2f93f3368da2d7d827e987ce6cdb3bd3b8a3390fde8fc33b#controller",
      "type": "EcdsaSecp256k1RecoveryMethod2020",
      "controller": "did:ethr:rinkeby:0x02ac49094591d32a4e2f93f3368da2d7d827e987ce6cdb3bd3b8a3390fde8fc33b",
      "blockchainAccountId": "0x80155C25E363Ee9e1BbBCC08cD5Df7CD249A98C4@eip155:4"
    },
    {
      "id": "did:ethr:rinkeby:0x02ac49094591d32a4e2f93f3368da2d7d827e987ce6cdb3bd3b8a3390fde8fc33b#controllerKey",
      "type": "EcdsaSecp256k1VerificationKey2019",
      "controller": "did:ethr:rinkeby:0x02ac49094591d32a4e2f93f3368da2d7d827e987ce6cdb3bd3b8a3390fde8fc33b",
      "publicKeyHex": "0x02ac49094591d32a4e2f93f3368da2d7d827e987ce6cdb3bd3b8a3390fde8fc33b"
    }
  ],
  "authentication": [
    "did:ethr:rinkeby:0x02ac49094591d32a4e2f93f3368da2d7d827e987ce6cdb3bd3b8a3390fde8fc33b#controller",
    "did:ethr:rinkeby:0x02ac49094591d32a4e2f93f3368da2d7d827e987ce6cdb3bd3b8a3390fde8fc33b#controllerKey"
  ],
  "assertionMethod": [
    "did:ethr:rinkeby:0x02ac49094591d32a4e2f93f3368da2d7d827e987ce6cdb3bd3b8a3390fde8fc33b#controller",
    "did:ethr:rinkeby:0x02ac49094591d32a4e2f93f3368da2d7d827e987ce6cdb3bd3b8a3390fde8fc33b#controllerKey"
  ]
}
 */

```

## Exchange verifiable data

### Signing JWT

A JWT is a JSON object that is signed so it can be verified as being created by a given DID. A JWT looks like this:
`eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJpc3MiOiJkaWQ6dXBvcnQ6Mm5RdGlRRzZDZ20xR1lUQmFhS0Fncjc2dVk3aVNleFVrcVgiLCJpYXQiOjE0ODUzMjExMzMsInJlcXVlc3RlZCI6WyJuYW1lIiwicGhvbmUiXX0.1hyeUGRBb-cgvjD5KKbpVJBF4TfDjYxrI8SWRJ-GyrJrNLAxt4MutKMFQyF1k_YkxbVozGJ_4XmgZqNaW4OvCw`

If an `EthrDID` is initialized with a `privateKey` (as it is when creating it from a key pair) then it has the ability
to sign JWT.

```ts
const helloJWT = await ethrDid.signJWT({hello: 'world'})
```

If you inspect the resulting JWT (you can do that on https://jwt.io or by
calling [`did-jwt#decodeJWT()`](https://github.com/decentralized-identity/did-jwt/blob/83a06323c29e26184808816bb463cb0f807919c7/src/JWT.ts#L176))
, you will notice that the `iss` property of the payload is set to the DID that you created earlier.

### Verifying a JWT

An `EthrDID` can also verify JWTs that have DIDs as issuers by leveraging the functionality of
the [`did-jwt`](https://github.com/decentralized-identity/did-jwt) library.

You will need to use the `didResolver` you just created.

```ts
try {
  const { payload, issuer } = await ethrDid.verifyJWT(jwt, didResolver);
  // `issuer` contains the DID of the signing identity
  console.log(issuer)
} catch(e) {
  console.error('unable to verify JWT: ', e)
}
```

## Manage Keys

The Ethr-DID supports general key management that can be used to change ownership of keys, delegate signing rights
temporarily to another account, and update key and service information in its DID document.

### The Concept of Identity Ownership

By default, in ERC1056 an ethereum address (or public key) is owned by itself. This means that creating a DID using
EthrDID is free, as it doesn't involve the sending of transactions.

An owner is an address that is able to make and publish changes to the DID. As this is a very important function, you
could change the ownership to use a smart contract based address implementing recovery or multi-sig at some point in the
future. Smart contracts are not able to sign, so you would also need to add a key pair based address as a signing
delegate.

Most web3 providers also don't allow users to sign data that is compatible with JWT standards. This means that you would
have to add a separate delegate key that you can use to sign JWTs on your behalf.

All the following functions assume that the passed in web3 provider can sign Ethereum transactions on behalf of the
`owner` address, or that you are using a `txSigner` to represent the owner address.

### Changing an Owner

You can change the owner of an Ethr-DID. This is useful in particular if you are changing a provider and want to
continue to use the same identifier.

This creates an Ethereum transaction, which will also broadcast a `DIDOwnerChanged` event. Make sure that the current
account owner has sufficient gas to be able to update it.

```ts
await ethrDid.changeOwner(newOwner)
```

Changing the owner to the `null` address means deactivating it (and implicitly revoking all existing keys and services).

### Adding a Delegate Signer

You can temporarily add a delegate signer to your DID. This is an address that can sign JWTs on your behalf. By adding
an `expiresIn` value, it will automatically expire after a certain time. By default, it will expire after one day.

You can add different delegate types. The two types currently supported
by [DID-JWT](https://github.com/decentralized-identity/did-jwt) are:

- `veriKey` Which adds a `EcdsaSecp256k1RecoveryMethod2020` to the `assertionMethod` section of the DID document
  (*Default* for signing general purpose JWTs using `ES256K-R`)
- `sigAuth` Which adds a `EcdsaSecp256k1RecoveryMethod2020` to the `assertionMethod` and `authentication` sections of
  the DID document.

This is useful if you want to give a dApp the permission to sign on your behalf. This creates an Ethereum transaction,
so your current owner account needs sufficient gas to be able to update it.

```ts
await ethrDid.addDelegate(web3.eth.accounts[3])

// Override defaults to expire in 100 days and have ability to authenticate.
await ethrDid.addDelegate(web3.eth.accounts[3], {expiresIn: 8640000, delegateType: 'sigAuth'})
```

There also exists a convenience function that creates a new delegate key pair, configures a signer with it and finally
calls the above `addDelegate()` function.

```ts
const {kp, txHash} = await ethrDid.createSigningDelegate('sigAuth', 360)
```

The `kp` object contains an `address` and `privateKey` attribute. Unless the key is just added temporarily, store it
somewhere safe.

Delegate addresses can be queried both on-chain (
see [`validDelegate()`](https://github.com/uport-project/ethr-did-registry#looking-up-a-delegate)) and off-chain through
the DID document, but they can only represent ethereum addresses, which limits the types of proofs they can produce.
(`ES256K-R` is not a registered algorithm for JWT). For this reason, it is often better to use attributes to add
different types of keys with different capabilities.

### Set Public Attributes

You can set various public attributes to your DID using `setAttribute(key, value, expiresIn)`. These cannot be queried
within smart contracts, but they let you publish information to your DID document such as public encryption keys.

The following attribute `key` formats are currently support:

- `did/pub/(Secp256k1|Rsa|Ed25519)/(veriKey|sigAuth)/(hex|base64|base58)` for adding a public key
- `did/svc/[ServiceName]` for adding a service

By adding an `expiresIn` value, it will automatically expire after a certain time. By default, it expires after one day.

```ts
await ethrDid.setAttribute('did/pub/Secp256k1/sigAuth/hex', '0x034cc8162c28eb201a4b538d6915d08889296a36df34ca76ab2401e804f31cae7a', 31104000)
await ethrDid.setAttribute('did/pub/Ed25519/veriKey/base64', Buffer.from('Arl8MN52fwhM4wgBaO4pMFO6M7I11xFqMmPSnxRQk2tx', 'base64'), 31104000)
await ethrDid.setAttribute('did/svc/HubService', 'https://hubs.uport.me', 10)
```

The [`did:ethr` spec](https://github.com/decentralized-identity/ethr-did-resolver/blob/master/doc/did-method-spec.md)
has extensive information on the various attributes you can use.
