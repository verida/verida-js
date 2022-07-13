## [5.0.4](https://github.com/decentralized-identity/ethr-did-resolver/compare/5.0.3...5.0.4) (2022-01-20)


### Bug Fixes

* broaden window for event logs processing (fix Aurora) ([#149](https://github.com/decentralized-identity/ethr-did-resolver/issues/149)) ([5ee6bed](https://github.com/decentralized-identity/ethr-did-resolver/commit/5ee6beda7547fdc2dca4a3a2f0f62442c676861f))

## [5.0.3](https://github.com/decentralized-identity/ethr-did-resolver/compare/5.0.2...5.0.3) (2022-01-13)


### Bug Fixes

* **deps:** remove querystring in favor of UrlSearchParams ([cd5e596](https://github.com/decentralized-identity/ethr-did-resolver/commit/cd5e596b688d73c4a47b2f59b19021d66e77679d))

## [5.0.2](https://github.com/decentralized-identity/ethr-did-resolver/compare/5.0.1...5.0.2) (2021-11-10)


### Bug Fixes

* **deps:** bump ethers to ^5.5.0 ([c39788a](https://github.com/decentralized-identity/ethr-did-resolver/commit/c39788a3de71b60cd962b23d073f35cff95c63d7))

## [5.0.1](https://github.com/decentralized-identity/ethr-did-resolver/compare/5.0.0...5.0.1) (2021-11-10)


### Bug Fixes

* **deps:** bump did-resolver to 3.1.3+ ([0ddde4b](https://github.com/decentralized-identity/ethr-did-resolver/commit/0ddde4b7ec3946bee22cc29e42dbba2dedd06585))

# [5.0.0](https://github.com/decentralized-identity/ethr-did-resolver/compare/4.3.5...5.0.0) (2021-11-10)


### Bug Fixes

* remove 0x prefix from publicKeyHex ([#147](https://github.com/decentralized-identity/ethr-did-resolver/issues/147)) ([063ee67](https://github.com/decentralized-identity/ethr-did-resolver/commit/063ee67a6107f325edff34b7aa89daa26b33a8c5)), closes [#140](https://github.com/decentralized-identity/ethr-did-resolver/issues/140)


### BREAKING CHANGES

* `publicKeyHex` values in the DID document no longer contain a `0x` prefix

## [4.3.5](https://github.com/decentralized-identity/ethr-did-resolver/compare/4.3.4...4.3.5) (2021-11-10)


### Bug Fixes

* reference /enc/ keys in `keyAgreement` section of DID doc ([#146](https://github.com/decentralized-identity/ethr-did-resolver/issues/146)) ([5d507ef](https://github.com/decentralized-identity/ethr-did-resolver/commit/5d507ef3d31014fb298f33219d1ce9ff71a0b566)), closes [#145](https://github.com/decentralized-identity/ethr-did-resolver/issues/145)

## [4.3.4](https://github.com/decentralized-identity/ethr-did-resolver/compare/4.3.3...4.3.4) (2021-06-24)


### Bug Fixes

* maintenance of dependencies, bots and build scripts ([#136](https://github.com/decentralized-identity/ethr-did-resolver/issues/136)) ([0d3fcf7](https://github.com/decentralized-identity/ethr-did-resolver/commit/0d3fcf74630549252605253b51415cc248b6e4d5))

## [4.3.3](https://github.com/decentralized-identity/ethr-did-resolver/compare/4.3.2...4.3.3) (2021-04-23)


### Bug Fixes

* strip milliseconds from dateTime strings ([#129](https://github.com/decentralized-identity/ethr-did-resolver/issues/129)) ([3e958af](https://github.com/decentralized-identity/ethr-did-resolver/commit/3e958afc37916aa3f6de3c7e7a8cf41e0718df34)), closes [#126](https://github.com/decentralized-identity/ethr-did-resolver/issues/126)

## [4.3.2](https://github.com/decentralized-identity/ethr-did-resolver/compare/4.3.1...4.3.2) (2021-04-22)


### Bug Fixes

* use rpcUrl in controller config ([#128](https://github.com/decentralized-identity/ethr-did-resolver/issues/128)) ([5302536](https://github.com/decentralized-identity/ethr-did-resolver/commit/53025365030df2d132156c15e6982e81af6d9ef2)), closes [#127](https://github.com/decentralized-identity/ethr-did-resolver/issues/127)

## [4.3.1](https://github.com/decentralized-identity/ethr-did-resolver/compare/4.3.0...4.3.1) (2021-04-22)


### Bug Fixes

* ignore query string when interpreting identifiers ([#123](https://github.com/decentralized-identity/ethr-did-resolver/issues/123)) ([5508f8a](https://github.com/decentralized-identity/ethr-did-resolver/commit/5508f8a45149417eac44dae0103e6f7edb566c83)), closes [#122](https://github.com/decentralized-identity/ethr-did-resolver/issues/122)

# [4.3.0](https://github.com/decentralized-identity/ethr-did-resolver/compare/4.2.0...4.3.0) (2021-04-20)


### Features

* add `assertionMethod` by default to didDocument ([#124](https://github.com/decentralized-identity/ethr-did-resolver/issues/124)) ([11b2096](https://github.com/decentralized-identity/ethr-did-resolver/commit/11b20967fae66b784a527d92c39cd29f6dbe6b10)), closes [#117](https://github.com/decentralized-identity/ethr-did-resolver/issues/117) [#115](https://github.com/decentralized-identity/ethr-did-resolver/issues/115)

# [4.2.0](https://github.com/decentralized-identity/ethr-did-resolver/compare/4.1.0...4.2.0) (2021-04-16)


### Features

* versioning ([#121](https://github.com/decentralized-identity/ethr-did-resolver/issues/121)) ([b794d69](https://github.com/decentralized-identity/ethr-did-resolver/commit/b794d6975cb92ea5c87882546951d5d0771bde4f)), closes [#119](https://github.com/decentralized-identity/ethr-did-resolver/issues/119) [#118](https://github.com/decentralized-identity/ethr-did-resolver/issues/118) [#119](https://github.com/decentralized-identity/ethr-did-resolver/issues/119) [#118](https://github.com/decentralized-identity/ethr-did-resolver/issues/118)

# [4.1.0](https://github.com/decentralized-identity/ethr-did-resolver/compare/4.0.1...4.1.0) (2021-04-14)


### Features

* export `VdaDidController` helper class ([#120](https://github.com/decentralized-identity/ethr-did-resolver/issues/120)) ([745100d](https://github.com/decentralized-identity/ethr-did-resolver/commit/745100d6cbfd1170af483efb2bdd93784f8fd7a6))

## [4.0.1](https://github.com/decentralized-identity/ethr-did-resolver/compare/4.0.0...4.0.1) (2021-03-26)


### Bug Fixes

* **deps:** use Resolvable type from did-resolver ([d213ae6](https://github.com/decentralized-identity/ethr-did-resolver/commit/d213ae650a7ae706ffad92f3b213c478dd41883c))

# [4.0.0](https://github.com/decentralized-identity/ethr-did-resolver/compare/3.1.0...4.0.0) (2021-03-15)


### Features

* upgrade to latest did core spec ([#99](https://github.com/decentralized-identity/ethr-did-resolver/issues/99)) ([#109](https://github.com/decentralized-identity/ethr-did-resolver/issues/109)) ([#111](https://github.com/decentralized-identity/ethr-did-resolver/issues/111)) ([2a023b1](https://github.com/decentralized-identity/ethr-did-resolver/commit/2a023b15a3a6cba1da05f8439dacb26e898104f1)), closes [#105](https://github.com/decentralized-identity/ethr-did-resolver/issues/105) [#95](https://github.com/decentralized-identity/ethr-did-resolver/issues/95) [#106](https://github.com/decentralized-identity/ethr-did-resolver/issues/106) [#83](https://github.com/decentralized-identity/ethr-did-resolver/issues/83) [#85](https://github.com/decentralized-identity/ethr-did-resolver/issues/85) [#83](https://github.com/decentralized-identity/ethr-did-resolver/issues/83) [#85](https://github.com/decentralized-identity/ethr-did-resolver/issues/85) [#95](https://github.com/decentralized-identity/ethr-did-resolver/issues/95) [#105](https://github.com/decentralized-identity/ethr-did-resolver/issues/105) [#106](https://github.com/decentralized-identity/ethr-did-resolver/issues/106)


### BREAKING CHANGES

* The return type is `DIDResolutionResult` which wraps a `DIDDocument`.
* No errors are thrown during DID resolution. Please check `result.didResolutionMetadata.error` instead.
* This DID core spec requirement will break for users expecting `publicKey`, `ethereumAddress`, `Secp256k1VerificationKey2018` entries in the DID document. They are replaced with `verificationMethod`, `blockchainAccountId` and `EcdsaSecp256k1VerificationKey2019` and `EcdsaSecp256k1RecoveryMethod2020` depending on the content.

# [3.1.0](https://github.com/decentralized-identity/ethr-did-resolver/compare/3.0.3...3.1.0) (2021-03-15)


### Features

* upgrade to latest did core spec ([#99](https://github.com/decentralized-identity/ethr-did-resolver/issues/99)) ([#109](https://github.com/decentralized-identity/ethr-did-resolver/issues/109)) ([d46eea3](https://github.com/decentralized-identity/ethr-did-resolver/commit/d46eea3ad4d85450f75a645ea9b33aa5223dd7b0)), closes [#105](https://github.com/decentralized-identity/ethr-did-resolver/issues/105) [#95](https://github.com/decentralized-identity/ethr-did-resolver/issues/95) [#106](https://github.com/decentralized-identity/ethr-did-resolver/issues/106) [#83](https://github.com/decentralized-identity/ethr-did-resolver/issues/83) [#85](https://github.com/decentralized-identity/ethr-did-resolver/issues/85) [#83](https://github.com/decentralized-identity/ethr-did-resolver/issues/83) [#85](https://github.com/decentralized-identity/ethr-did-resolver/issues/85) [#95](https://github.com/decentralized-identity/ethr-did-resolver/issues/95) [#105](https://github.com/decentralized-identity/ethr-did-resolver/issues/105) [#106](https://github.com/decentralized-identity/ethr-did-resolver/issues/106)

## [3.0.3](https://github.com/decentralized-identity/ethr-did-resolver/compare/3.0.2...3.0.3) (2020-12-17)


### Bug Fixes

* **deps:** update dependency buffer to v6 ([#93](https://github.com/decentralized-identity/ethr-did-resolver/issues/93)) ([e1dc861](https://github.com/decentralized-identity/ethr-did-resolver/commit/e1dc8612b32c06b8bbb046fe6003d70ca1b3960d))
* **types:** simplify type exports ([#101](https://github.com/decentralized-identity/ethr-did-resolver/issues/101)) ([90ca9b5](https://github.com/decentralized-identity/ethr-did-resolver/commit/90ca9b5b3fb13c9531b542eb9fc8d3e51454d4b1))

## [3.0.2](https://github.com/decentralized-identity/ethr-did-resolver/compare/3.0.1...3.0.2) (2020-12-09)


### Bug Fixes

* **deps:** update dependency did-resolver to v2.1.2 ([8c2294e](https://github.com/decentralized-identity/ethr-did-resolver/commit/8c2294e83d8dd87df8a7ce2f860b3ad57ce27190))

## [3.0.1](https://github.com/decentralized-identity/ethr-did-resolver/compare/3.0.0...3.0.1) (2020-11-09)


### Bug Fixes

* reverse events to have consistent order ([#87](https://github.com/decentralized-identity/ethr-did-resolver/issues/87)) ([08b9692](https://github.com/decentralized-identity/ethr-did-resolver/commit/08b9692b8c6abf1da158fb3ce3dc4d49d9393068)), closes [/github.com/decentralized-identity/ethr-did-resolver/issues/86#issuecomment-699961595](https://github.com//github.com/decentralized-identity/ethr-did-resolver/issues/86/issues/issuecomment-699961595)

# [3.0.0](https://github.com/decentralized-identity/ethr-did-resolver/compare/2.4.0...3.0.0) (2020-08-24)


### Bug Fixes

* change 'owner' to 'controller' to follow W3C Spec ([#75](https://github.com/decentralized-identity/ethr-did-resolver/issues/75)) ([#81](https://github.com/decentralized-identity/ethr-did-resolver/issues/81)) ([af37b3f](https://github.com/decentralized-identity/ethr-did-resolver/commit/af37b3fe66dedda688156bb421948364c3ab3606))


### BREAKING CHANGES

* JWTs that refer to the `did:ethr:...#owner` key in their header may be considered invalid after this upgrade, as the key id is now `did:ethr:...#controller`

# [2.4.0](https://github.com/decentralized-identity/ethr-did-resolver/compare/2.3.4...2.4.0) (2020-08-21)


### Features

* add ability to use a compressed publicKey as identifier ([#73](https://github.com/decentralized-identity/ethr-did-resolver/issues/73)) ([e257eb3](https://github.com/decentralized-identity/ethr-did-resolver/commit/e257eb3b1681d7cde1a67e8056e4757589ceaaac)), closes [#56](https://github.com/decentralized-identity/ethr-did-resolver/issues/56)

## [2.3.4](https://github.com/decentralized-identity/ethr-did-resolver/compare/2.3.3...2.3.4) (2020-08-19)


### Bug Fixes

* **deps:** update dependency did-resolver to v2.1.1 ([1a4cbca](https://github.com/decentralized-identity/ethr-did-resolver/commit/1a4cbca3b849bc2ec6fea13df2ebae945bda499d))

## [2.3.3](https://github.com/decentralized-identity/ethr-did-resolver/compare/2.3.2...2.3.3) (2020-08-14)


### Bug Fixes

* **deps:** update dependency did-resolver to v2.1.0 ([b26d387](https://github.com/decentralized-identity/ethr-did-resolver/commit/b26d3878a2716f9cffcfa8d3fb918239254a9fc2))

## [2.3.2](https://github.com/decentralized-identity/ethr-did-resolver/compare/2.3.1...2.3.2) (2020-07-07)


### Bug Fixes

* **deps:** update dependency did-resolver to v2 ([#68](https://github.com/decentralized-identity/ethr-did-resolver/issues/68)) ([831ec17](https://github.com/decentralized-identity/ethr-did-resolver/commit/831ec17f7f1511295420f88e9869a4f85cb121da))

## [2.3.1](https://github.com/decentralized-identity/ethr-did-resolver/compare/2.3.0...2.3.1) (2020-07-04)


### Bug Fixes

* **deps:** update dependency ethjs-contract to ^0.2.0 ([b667ce6](https://github.com/decentralized-identity/ethr-did-resolver/commit/b667ce6757f01d39e6302d962d314d92901d3ffe))

# [2.3.0](https://github.com/decentralized-identity/ethr-did-resolver/compare/2.2.0...2.3.0) (2020-07-03)


### Bug Fixes

* **deps:** update dependency did-resolver to v1.1.0 ([ab47058](https://github.com/decentralized-identity/ethr-did-resolver/commit/ab470589d900f7abb97c80025405506b5ed422b8))


### Features

* add encryption key support for ethr-did-documents ([2f5825c](https://github.com/decentralized-identity/ethr-did-resolver/commit/2f5825cfa7540a470fea31c9dd89b873f659b2ec)), closes [#52](https://github.com/decentralized-identity/ethr-did-resolver/issues/52)

# [2.2.0](https://github.com/uport-project/ethr-did-resolver/compare/2.1.0...2.2.0) (2020-02-25)


### Features

* add encryption key support for ethr-did-documents ([dff7b0f](https://github.com/uport-project/ethr-did-resolver/commit/dff7b0f3efe562be315aa636ddb3ab3e4fded486)), closes [#52](https://github.com/uport-project/ethr-did-resolver/issues/52)

# [2.1.0](https://github.com/uport-project/ethr-did-resolver/compare/2.0.0...2.1.0) (2020-02-10)


### Features

* Add types declaration stubb ([05944b1](https://github.com/uport-project/ethr-did-resolver/commit/05944b16f51c33814bdc146a9d8629cb04e6a5fd))

# [2.0.0](https://github.com/uport-project/ethr-did-resolver/compare/1.0.3...2.0.0) (2020-01-24)


### Bug Fixes

* require a configuration to be used when initializing the resolver ([3adc029](https://github.com/uport-project/ethr-did-resolver/commit/3adc029150e86886b8951cec4295e0a97c232c11))


### BREAKING CHANGES

* this removes the fallback hardcoded RPC URLs and will fail early when a wrong configuration (or none) is provided to `getResolver()`

## [1.0.3](https://github.com/uport-project/ethr-did-resolver/compare/v1.0.2...1.0.3) (2019-11-11)


### Bug Fixes

* remove ejs module distribution ([780ec08](https://github.com/uport-project/ethr-did-resolver/commit/780ec08d49340858ae34d8f504265cb267a3173f)), closes [#39](https://github.com/uport-project/ethr-did-resolver/issues/39)
