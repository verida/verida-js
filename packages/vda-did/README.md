[![npm](https://img.shields.io/npm/dt/ethr-did.svg)](https://www.npmjs.com/package/ethr-did)
[![npm](https://img.shields.io/npm/v/ethr-did.svg)](https://www.npmjs.com/package/ethr-did)
[![GitHub Discussions](https://img.shields.io/github/discussions/uport-project/veramo?style=flat)](https://github.com/uport-project/veramo/discussions)
[![Twitter Follow](https://img.shields.io/twitter/follow/uport_me.svg?style=social&label=Follow)](https://twitter.com/uport_me)

# VDA-DID Library

This library forked [ethr-did](https://github.com/uport-project/ethr-did) and updated for Verida.

This library can be used to create a new ethr-did identifier. It allows ethr-did identifiers to be represented as an
object that can perform actions such as updating its DID document, signing messages, and verifying messages from other
DIDs.

Use this if you are looking for the easiest way to start using ethr-did identifiers, and want high-level abstractions to
access its entire range of capabilities. It encapsulates all the functionality
of [vda-did-resolver](https://github.com/verida/blockchain-vda-did-resolver)
and [vda-did-registry](https://github.com/verida/blockchain-contracts/tree/develop/VDA-DID-Registry).

An example of a DID document resolved using the Vda-Did-Resolver:

```javascript
{
  '@context': [
    'https://www.w3.org/ns/did/v1',
    'https://identity.foundation/EcdsaSecp256k1RecoverySignature2020/lds-ecdsa-secp256k1-recovery2020-0.0.jsonld'
  ],
  id: 'did:ethr:0xb9c5714089478a327f09197987f16f9e5d936e8a',
  verificationMethod: [
    {
      id: `did:ethr:0xb9c5714089478a327f09197987f16f9e5d936e8a#controller`,
      type: 'EcdsaSecp256k1RecoveryMethod2020',
      controller: did,
      blockchainAccountId: `did:ethr:0xb9c5714089478a327f09197987f16f9e5d936e8a@eip155:1`
    }
  ],
  assertionMethod: [`did:ethr:0xb9c5714089478a327f09197987f16f9e5d936e8a#controller`],
  authentication: [`did:ethr:0xb9c5714089478a327f09197987f16f9e5d936e8a#controller`]
}
```

On-chain refers to something that queried or modified with a transaction on a blockchain, while off-chain can refer to
anything from temporary payment channels to IPFS and regular web services.

It supports the proposed [Decentralized Identifiers](https://w3c.github.io/did-core/) spec from
the [W3C Credentials Community Group](https://w3c-ccg.github.io).

## Updates

Updated configuration for creating vda-did instance.
Now you can create vda-did in 2 modes of 'web3' & 'gasless'. Please refer to [vda-web3-client](https://github.com/verida/blockchain-contracts/tree/develop/VDA-DID-Registry).

# Test guide
This is temporary guide for local test till before library published to npm.<br/>
**1. `vda-did-resolver` set up for test.**
- Setup test environment for [vda-did-resolver](https://github.com/verida/blockchain-vda-did-resolver/blob/210-decentralized-did/README.md#test-guide)
- Run following command in the `vda-did-resolver` directory:
```
yarn link
```
**2. Download library by following command or any other git tools:**
```
git clone https://github.com/verida/blockchain-vda-did
```
**3. Install dependencies & build.**
- In the package.json file, comment out line#85 
>     "vda-did-resolver": "../vda-did-resolver/lib/"
- Install dependencies by `yarn install`.
- Link vda-did-resolver by `yarn link vda-did-resolver`
- Uncomment line#85 in the package.json file
- Build library by `yarn build`. After build success, test automatically starts.

**4. Test**

At the moment(in version 0.0.4), it supports 2 test file in the "__tests__" directory - bsc.test.ts, bsc_gasless.test.ts
As explained above, test automatically starts after build success. This step is to test without build again.

- Set up test files : You can set up what files to test by updating line#46 in the package.json file:
>       "**/__tests__/**/bsc_gasless.test.[jt]s"
- Test without build by `yarn test`.
