2024-07-15 (v.4.0.0)
-------------------

- Support BlockchainAnchor and Verida Network refactor

2023-12-26 (v.3.0.0)
-------------------

- Mainnet release
- Feature: Make `web3config` auto-populate `RPC_URL` and other defaults based on Verida environment
- Feature: Support easy method to destroy a DID

2023-04-20 (v2.3.0)
-------------------

- Make `VeridaDIDDocument` and `@did-document/DIDDocument` usage clearer
- Fix: Update tests to use updated devnet nodes

2023-03-27 (v2.2.1)
-------------------

- Fix tests

2022-03-01 (v2.1.3)
-------------------

- Support fetching RPC_URL for connected network

2023-02-09 (v2.0.5)
-------------------

- Handle resolver now returning `didDocument` instead of `didDocument.doc`

2023-01-27 (v2.0.4)
-------------------

- Remove engine restriction of Node 14 only

2023-01-24 (v2.0.2)
-------------------

- Upgrade to @verida/types

2023-01-13 (v2.0.0)
-------------------

- Support blockchain based DID lookup
- Support blockchain read/write via native web3 or via Verida meta transaction server (via `@verida/web3-client`)
- Support URL based DID document retrieval
- Support multiple service endpoints

2022-03-10 (v0.1.8)
-------------------

- Changes to support documentation generation

2022-02-27 (v0.1.7)
-------------------

- Fix: Strip trailing slash if it exists on an endpointUrl