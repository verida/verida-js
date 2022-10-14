[![npm](https://img.shields.io/npm/dt/ethr-did-resolver.svg)](https://www.npmjs.com/package/ethr-did-resolver)
[![npm](https://img.shields.io/npm/v/ethr-did-resolver.svg)](https://www.npmjs.com/package/ethr-did-resolver)
[![codecov](https://codecov.io/gh/decentralized-identity/ethr-did-resolver/branch/develop/graph/badge.svg)](https://codecov.io/gh/decentralized-identity/ethr-did-resolver)

# VDA DID Resolver

This library is forked [ethr-did-resolver](https://github.com/decentralized-identity/ethr-did-resolver) and updated for [vda-did-registry](https://github.com/verida/blockchain-contracts).

## Updates on `ethr-did-resolver`
- Update resolving logic :<br/>
  Updated `reslove()` method to support custom fields of vda-did-document.
- `VdaDidController` supports 2 modes for interacting with `vda-did-registry` contract: <br/>
  `VdaDidController`(in controller.ts) now interacts with `vda-did-registry` contract in 2 modes of `web3` & `gasless`.
Original `EthrDidController` interacts with `ethr-did-registry` contract directly.

# Test Guide
This is temporary guide for local test till before library published to npm.<br/>
**1. Vda-web3-client Setup**
- Download [vda-web3-client](https://github.com/verida/blockchain-vda-web3-client).
- Install dependencies & compile `vda-web3-client`:
```
yarn install && yarn compile
```
- run following command in `vda-web3-client`:
```
yarn link
```
**2. Download library by following command or any other git tools:**
```
> git clone https://github.com/verida/blockchain-vda-did-resolver
```
**3. Install dependencies**
- First comment out line#84 in package.json file:
>     "vda-did-resolver": "../vda-did-resolver/lib/"
- Install dependencies by `yarn install` in the project folder.
- Link `vda-web3-client` by `yarn link @verida/web3`.
- Uncomment line#84 in package.json file
##4. Build library**
Build library by following command:
```
yarn build
```
