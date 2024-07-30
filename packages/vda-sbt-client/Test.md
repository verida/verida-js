# VDA Node Manager Test

Here explains stuffs related to test this `@verida/vda-node-manager` package.

- Add trusted signers
    The contract owner should add `TRUSTED_SIGNER` in the `@verida/vda-common-test/src/const.ts`(`0x0162aE4B571E9daB51309f885200aDdF04F33747`)

- Enough Matic in `RECIPIENT` wallet
    `RECIPIENT_WALLET` in the `verida/vda-common-test/src/const.ts` should have enough matic to make transactions. (`0xeea7e0781317408d84aD70d1AA8c7553D3D31cA5`)