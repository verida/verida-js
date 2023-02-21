
# VDA DID Resolver

Provides a simple `getResolver()` method that supports resolving Verida DID's.

# Installation

```
yarn add @verida/vda-did-resolver
```

# Usage

```js
import { Resolver } from 'did-resolver'
import { getResolver } from '@verida/did-resolver'

const vdaDidResolver = getResolver()
const didResolver = new Resolver(vdaDidResolver)

const did = 'did:vda:testnet:0x....'

try {
    const response = await didResolver.resolve(did)
    const didDocument = response.didDocument
} catch (err) {
    console.error(err.message)
}
```

# Configuration

`getResolver(Web3ResolverConfigurationOptions: {})` supports the following configuration:

```js
export interface Web3ResolverConfigurationOptions {
    rpcUrl?: string;
    timeout?: number;
}
```

Where:

- `rpcUrl` - An optional Polygon RPC_URL to use (a default public RPC_URL is set as default)
- `timeout` - An optional timeout (in milliseconds) to wait before failing HTTP requests to API endpoints hosting copies of the DID Document