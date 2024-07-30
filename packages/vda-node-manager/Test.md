# VDA Node Manager Test

Here explains stuffs related to test this `@verida/vda-node-manager` package.

## owner.test.ts
- Only the contract owner can test this file.

## user_write.test.ts
Before testing this file, `owner.test.ts` should be passed. The `owner.test.ts` mange trusted signers, registered nodes & removed nodes, and etc.

- Anybody can test this file

## user_read.test.ts
Before testing this file, `user_write.test.ts` should be passed. In the `user_write.test.ts`, it calls `addInitialData()` function to add necessary informations

- Anybody can test this file


## stake_and_lock.test.ts
This test file involves Token contract operations. Here, the `PRIVATE_KEY` in the `.env` file should be the owner of the Token contract.
Can check the Token contract address by the `getVDATokenAddress()` function of the `VeridaNodeManager`.