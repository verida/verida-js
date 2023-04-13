
# VDA Common
This package provide common **constant**s and **function**s for other libraries.

## Package structure
Mainly consist of 2 parts - `common` and `test`.

### **Common** (src/common)
- "/abi" : Includes all ABI files of verida contracts
- contract.ts : Provide functions related verida contracts
- rpc.ts : Provide functions related RPC urls to interact with blockchains.
- util.ts : Provide utility functions

### **Test** (src/test)
The codes here are used in test codes only.
- const.ts : Defined all constants for test
- proof.ts : Provide functions related signature for interacting with Verida contracts
- utils.ts : Provide utility functions