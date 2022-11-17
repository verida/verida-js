# blockchain-vda-web3-client
This is a Java script library that provides services to interact with Verida contracts with or without paying gas fees.

## Install
```
yarn install @verida/web3
```
or
```
npm i @verida/web3
```

## Creating Verida Contract instance
Developer can create instance in 2 modes of 'web3' or 'gasless'.
```
const instance = getVeridaContract('web3'/'gasless', {/*Configuration*/})
```
Configurations are a bit different for both modes:
### Configuration for 'web3' mode
```
{
  // Contract Info
  abi, // required - ABI of targeting contract
  address, // required - Contract address deployed on Polygon net. Now Verida supports only Polygon network. Later it can be updated.

  // Web3 configuration
  signer, // optional - A signer that sign the blockchain transactions.
  provider, // optional - General web3 provider. It can be provider from MetaMask or any other wallet
  rpcUrl, // optional - RPC of targeting network
  web3, // optional - Web3 object
}
```
### Configuration for 'gasless' mode
```
{
  // Contract Info
  abi, // required - ABI of targeting contract
  address, // required - Contract address deployed on Polygon net. Now Verida supports only Polygon network. Later it can be updated.

  // gasless configuration
  veridaKey, // required - To use gasless transaction, need verida key that is provided by Verida.
  serverConfig: {
    headers: {
      context-name: '...', // required - Used to create Axios server that interacts with meta-transaction server
      ... // Can add other fields
    }
    ... // can add other fields
  },
  postConfig: {
    headers: {
      user-agent: '...', // required - used to verify the validation of meta-transaction requests.
      ... // Can add other fields
    }
    ... // Can add other fields
  }
}
```

## Interacting with Contract
Developers can call any contract functions using instace created above.
```
const ret = instance.identityOwner('0x12...5f')
```

## Return Values
Return values is in JSON format. 
Refer : https://github.com/verida/blockchain-gasless-server/tree/review/generic-example#endpoint-returns

## Test
There are 2 test modes of "direct" & "gasless". Default mode is "direct".
You can specify the test mode at the end of command.
### Test all files
You can run all test files in "gasless" mode by:
```
yarn tests gasless
```
If you don't specify test mode, it will test in "direct" mode.

### Test individual test files
You can run individual test files by `yarn test`.

**Example** : Test didregistry.test.ts in "gasless" mode:
```
yarn test test/didregistry.test.ts gasless
```
