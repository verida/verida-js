
# Verida Javascript Library

This monorepo contains [Verida Client Library](https://github.com/verida/verida-js/tree/main/packages/verida-ts) and a variety of utility packages that support that library.

There is a React Native repository that maintains a slightly modified version of the `Verida Client Library` that is used to generate the [@verida/client-rn](https://github.com/verida/client-rn) package.

## Packages

These are the main packages you are likely to use:

- [client-ts](https://github.com/verida/verida-js/tree/main/packages/client-ts): Verida client library. Install this library in your project to add support for the Verida protocol.
- [account-web-vault](https://github.com/verida/verida-js/tree/main/packages/account-web-vault): Create an instance of a 3ID web account that uses a QR code and the Verida Vault to sign authentication requests. Use this for your web application.
- [account-node](https://github.com/verida/verida-js/tree/main/packages/account-node): Create an instance of a 3ID account using a blockchain private key. Automatically signs all authentication requests. Use this for NodeJS server side applications or React Native applications.

These are helper packages that typically aren't used directly:

- [3id-utils-node](https://github.com/verida/verida-js/tree/main/packages/3id-utils-node): Utilities for managing 3ID identities
- [account-3id-connect](https://github.com/verida/verida-js/tree/main/packages/account-3id-connect): Create an instance of a 3ID account using the 3ID connect library. Do not use, for proof of concept purposes only.
- [account](https://github.com/verida/verida-js/tree/main/packages/account): Common code shared amongst the various `account-xxx` implementations
- [encryption-utils](https://github.com/verida/verida-js/encryption-utils): Encryption utilities to make using `tweetnacl` a bit easier
- [keyring](https://github.com/verida/verida-js/tree/main/packages/keyring): Keyring for managing asym, sym and signing keys for a given account context
- [storage-link](https://github.com/verida/verida-js/tree/main/packages/storage-link): Utilities to help linking storage endpoint information to a 3ID account using IDX

## Developer Notes

### Node Version

This requires **node v12.20.0** to build. We use [nvm](https://github.com/nvm-sh/nvm) to manage this:

```
nvm install v12.20.0
nvm use v12.20.0
```


### Linking dependencies

It's not possible to add dependencies between monorepo packages using yarn (ie: `yarn add @verida/3id-utils-node`) if that package hasn't been published to `npm`.

Unpublished dependencies betwen monorepo packages can be linked by:

- Manually adding the expected dependency to `package.json` (ie: `@verida/3id-utils-node`)
- Run `npx lerna bootstrap` in the root directory of this project

### Building

General process:
* `cd package/package-name` (ie, the package names listed below)
* `yarn`
* `yarn build`
* `yarn link`

Need to build the packages in this order:

1. encryption-utils 
2. keyring
3. 3id-utils-node
4. storage-link
5. account
6. account-node
7. account-3id-connect
8. account-web-vault
9. client-ts


## Creating a release

```
$ npx lerna publish
```