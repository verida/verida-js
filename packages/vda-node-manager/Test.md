# VDA Node Manager Test

Here explains stuffs related to test this `@verida/vda-node-manager` package.

## owner.test.ts
Only the contract owner can test this file.

## user_write.test.ts
- Add initial data
    There are some stuffs to be done before testing this file. This can be done by only the contract owner.
    If users try to test this `user_write.test.ts` file before the contract owner does, they'd face the errors.

- Get received the token to the `PROVIDER` address
    In the `.env` file, users set `PROVIDER_KEY` that is the private key of `PROVIDER` for testing the `depositFromProvider()` function.
    Request the Token contract owner to send tokens to the `PROVIDER` address
    Here, the Token contract address is get by `getVDATokenAddress()` function of the `src/userApi.ts`

## user_read.test.ts
- Anybody can test this file
