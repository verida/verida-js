2024-07-15 (v.4.0.0)
-------------------

- Support BlockchainAnchor and Verida Network refactor
- Minor updates for changes in `vda-web3-client`
- Test code updated
- Updated `.env.example` file

2023-12-26 (v3.0.0)
-------------------

- Mainnet release
- Fix: Ethers dependency was dev only
- Feature: Include on-chain error message in thrown exception
- Feature: Added manual gas configuration for the non-view contract functions
- Feature: Update test files for testnet with various gas configurations
- Feature: Added test file for mainnet test
- Fix: Maximum three retries when creating a DID to prevent infinite loops

2023-04-27 (v2.3.4)
-------------------

- Update contract name of ABI

2023-04-20 (v2.3.0)
-------------------

- Update to latest protocol dependencies
- Update tests
- Update contract address (breaking change)

2023-03-27 (v2.2.1)
-------------------

- Fix tests

2022-03-01 (v2.1.3)
-------------------

- Add usage and configuration instructions to README.md
- Fix timeout issues with tests
- Support optional `signer` function instead of `signKey`

2022-02-09 (v2.0.5)
-------------------

- Fix: Handle string error response from Axios
- Fix: circular dependency to vda-did-resolver

2023-01-27 (v2.0.4)
-------------------

- Remove engine restriction of Node 14 only

2023-01-24 (v2.0.2)
-------------------

- Upgrade to @verida/types

2023-01-17 (v2.0.1)
-------------------

- Fix: Update test endpoints

2023-01-13 (v2.0.0)
-------------------

- Initial implementation (v2.0.0 to be inline with the rest of the protocol)