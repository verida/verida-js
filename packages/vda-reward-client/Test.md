# VDA Node Manager Test

Here explains stuffs related to test this `@verida/vda-node-manager` package.

## Confirm the token addresses of the `StorageNodeRegistry` contract and `Reward` contract
    The Token contract addresses of `StorageNodeRegistry` contract and `Reward` contract should be the same.

### Check Token contract of `StorageNodeRegistry`
    Call the `getVDATokenAddress()` function of the `StorageNodeRegistry` contract
### Check Token contract of `Reward` contract
    Call the `getTokenAddress()` function of the `Reward` contract

## owner.test.ts
Only the contract owner can test this file.

## user_write.test.ts
- Add initial data
    There are some stuffs to be done before testing this file. Before running this test files, trusted signers and claim types should be added. This can be done by only the contract owner.
    If users try to test this `user_write.test.ts` file before the contract owner does, they'd face the errors.

- Get received the token to the `Reward` contract
    Request the Token contract owner to send tokens to the `Reward` contract address

## user_read.test.ts
- Anybody can test this file
