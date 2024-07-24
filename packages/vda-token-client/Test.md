# VDA Token Client Test

Here explains stuffs related to test this `@verida/vda-token-client` package.

## owner.test.ts
- Only the contract owner can test this file

## read.test.ts
- Anybody can test this file

## write.test.ts
Please check following before run this test:
- Token balances of following addresses:<br>
```ts
0x8Ec5df9Ebc9554CECaA1067F974bD34735d3e539: More than `AMOUNT_SEND`(=1000) tokens
0xE3A441c4e699433FCf1262246Cf323d8e4302998: More than `AMOUNT_APPROVE`(=1000) tokens
```

- Enough Matic in following addresses:
```ts
0x8Ec5df9Ebc9554CECaA1067F974bD34735d3e539,
0xE3A441c4e699433FCf1262246Cf323d8e4302998
```