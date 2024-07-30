2024-07-15 (v.4.0.0)
-------------------

- Support BlockchainAnchor and Verida Network refactor

2023-12-26 (v.3.0.0)
-------------------

- Mainnet release
- Support `verifyDidControlsDomain()` helper

2023-04-20 (v2.3.0)
-------------------

- Fix: `wrapUri` didn't have `https` for default `wrapperUri`

2023-03-10 (v2.2.0)
-------------------

- Support `wrapUri()` method
- Fix: ExplodeVeridaUri regex breaking when there are no query params
- Add explode DID helper method
- Support deep attributes in Verida URIs
- Add unit tests
- Support `deepAttributes` in `buildVeridaUri()`
- Unwrap `deepAttributes` in `fetchVeridaUri()` before attempting to decrypt

2023-02-16 (v2.1.1)
-------------------

- First release