
# Verida 3ID Node Utils

This helper library provides utilities to manage 3ID's for blockchain accounts within NodeJs.

It supports creating a new 3ID and linking an existing blockchain account to an existing 3ID.

Supported blockchains:

- Ethereum
- NEAR

## Usage

Install the package:

```
$ yarn install @verida/3id-utils-node
```

Use the package:

```
import { Utils } from '../src/index'

const PRIVATE_KEY = '0x....'

const utils = new Utils()
const ceramic1 = await utils.createAccount('ethr', PRIVATE_KEY)
console.log(`3ID created: ${ceramic1.did.id}`)
```

See the [unit tests](./test) for more guidance.

## Blockchain Notes

### Ethereum

Implemented in such a way that signing of consent messages uses `ethers.js`, instead of Ethereum JSON-RPC.

### NEAR

Implemented, but not currently working due to Ceramic not completing NEAR support.