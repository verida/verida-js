2022-01-27 (v2.0.4)
-------------------

- Remove engine restriction of Node 14 only

2022-01-24 (v2.0.2)
-------------------

- Upgrade to @verida/types

2022-01-13 (v2.0.0)
-------------------

- Support multiple endpoints for contexts
- Support getting auth context directly
- Support disconnecting a specific device
- Support blockchain enabled Verida DID Method

2022-03-10 (v1.1.9)
-------------------

- Changes to support documentation generation

2022-02-27 (v1.1.8)
-------------------

- Fix: Storage config only force create if storage config not found. Previously force created all the time, which caused unexpected udpates

2022-01-24 (v1.1.7)
-------------------

- Update @verida/account-node updated README.md

2021-11-13 (v1.1.4)
-------------------

- Update @verida/account to latest

2021-10-27 (v1.1.0)
-------------------

- Large refactor to use [Verida DID Server](https://github.com/verida/did-server) and Ethereum compatible key structure

2021-10-04 (v1.0.3)
-------------------

- Move `3id` config options (ie: specifying `did`) into `NodeAccountConfig` parameter

2021-09-22 (v1.0.1)
-------------------

- Add `LimitedAccount` that will only support actions for a pre-determined list of contexts