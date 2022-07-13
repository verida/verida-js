Ethr-DID
========

A Scalable Identity Method for Ethereum Addresses
-------------------------------------------------

uPort is a self-sovereign digital identity platform---anchored on the Ethereum blockchain. The uPort technology
primarily consists of smart contracts, developer libraries, and a mobile app. uPort identities are fully owned and
controlled by the creator---independent of centralized third-parties for creation, control or validation.

Using the Ethr-DID library, you can:

- Create and manage keys for DID identities

- Sign JSON Web Tokens

- Authorize third parties to sign on a DID's behalf

- Enable discovery of service endpoints (e.g. decentralized identity management services)

See [the guide](./guides/index.md) for more info

The Ethr-DID library conforms to [ERC-1056](https://github.com/ethereum/EIPs/issues/1056) and supports the proposed
Decentralized Identifiers spec from the W3C Credentials Community Group. These allow for Ethereum addresses and public
keys to be used as fully self-managed Decentralized Identifiers (DIDs), as a result, you can easily create and manage
keys for these identities. This library also allows you to sign standard compliant JSON Web Tokens (JWTs) that can be
consumed using the DID-JWT library.
