
# Verida Javascript Library

This monorepo contains [Verida Client Library](https://github.com/verida/verida-js/tree/main/packages/verida-ts) and a variety of utility packages that support that library.

There is a React Native repository that maintains a slightly modified version of the `Verida Client Library` that is used to generate the [@verida/client-rn](https://github.com/verida/client-rn) package.

## Packages

These are the main packages you are likely to use:

- [client-ts](https://github.com/verida/verida-js/tree/main/packages/client-ts): Verida client library. Install this library in your project to add support for the Verida protocol.
- [account-web-vault](https://github.com/verida/verida-js/tree/main/packages/account-web-vault): Create a Verida network connection that uses a QR code and the Verida Vault to sign authentication requests. Use this for your web application.
- [account-node](https://github.com/verida/verida-js/tree/main/packages/account-node): Create an instance of a Verida account using a private key or seed phrase. Automatically signs all authentication requests. Use this for NodeJS server side applications or React Native applications.

These are helper packages that typically aren't used directly:

- [account](https://github.com/verida/verida-js/tree/main/packages/account): Common code shared amongst the various `account-xxx` implementations
- [encryption-utils](https://github.com/verida/verida-js/encryption-utils): Encryption utilities to make using `tweetnacl` a bit easier
- [keyring](https://github.com/verida/verida-js/tree/main/packages/keyring): Keyring for managing asym, sym and signing keys for a given account context
- [storage-link](https://github.com/verida/verida-js/tree/main/packages/storage-link): Utilities to help linking storage endpoint information to a Verida account

## Developer Notes

### Node Version

This requires **node v14.17.1** to build. We use [nvm](https://github.com/nvm-sh/nvm) to manage this:

```
nvm install v14.17.1
nvm use v14.17.1
```


### Linking dependencies

It's not possible to add dependencies between monorepo packages using yarn (ie: `yarn add @verida/encryption-utils`) if that package hasn't been published to `npm`.

Unpublished dependencies betwen monorepo packages can be linked by:

- Manually adding the expected dependency to `package.json` (ie: `@verida/encryption-utils`)
- Run `npx lerna bootstrap` in the root directory of this project


### Building

Build everything:

In the root directory:

```
npx lerna bootstrap
npx lerna run build
```

To build a specific package:

* `cd package/package-name`
* `yarn`
* `yarn build`



## Creating a release

Update all the CHANGELOG.md files in each package to include entries for all the changes made since the last release.

```
$ npx lerna run build
$ npx lerna publish --dist-tag next
```

Use tag `next` for an upcoming release or `latest` for the latest version.
