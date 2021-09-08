
# 3ID Connect Account

**WARNING: DO NOT USE THIS LIBRARY! SEE "WARNING" BELOW**

This package enables a user to authenticate with 3ID in their browser and then unlock / create Verida storage contexts.

## Usage

```
const CERAMIC_URL = 'https://ceramic-clay.3boxlabs.com'
const web3ModalConfig = {
    network: "mainnet"
}

const account = new ThreeIdConnectAccount(web3ModalConfig, CERAMIC_URL)
```

`account` can then be used instantiate a new [Verida Context or Client](https://github.com/verida/verida-js/client-ts).

## Warning

This library allows a webpage to unlock a user's 3ID, giving that application the privateKey to do anything with the account. This is simlar to providing an application a private blockchain key to perform transactions.

Instead, you should use [Verida Vault Account](https://github.com/verida/verida-js/account-web-vault) that ensures a users' private keys remain on their mobile device and Verida Context's are opened after confirmation by the user on their device.