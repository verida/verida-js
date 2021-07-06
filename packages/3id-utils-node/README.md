
## Verida 3ID Node Utils

This helper library provides utilities to manage 3ID's for blockchain accounts within NodeJs.

It supports creating a new 3ID and linking an existing blockchain account to an existing 3ID.

### Ethereum

Only blockchain supported at this stage.

Implemented in such a way that signing of consent messages uses `ethers.js`, instead of Ethereum JSON-RPC.