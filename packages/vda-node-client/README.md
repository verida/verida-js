
# VDA Node Client
A client library that read nodat & datacenter information.
This library calls only read functions of `vda-node-manager` package.

## Installation

```
yarn add @verida/vda-node-client
```

## Function List
This library provide following functions:

#### *Contract Decimal for Latitude and Longitude*
```ts
async function getContractDecimal(network: string): Promise<number>
```
#### *Get Verida Token address*
```ts
async function getVDATokenAddress(network: string): Promise<string>
```
#### *Data Centers*
```ts
async function isRegisteredDataCenterName(network: string, name: string)
async function getDataCenters(network: string, ids: BigNumberish[])
async function getDataCentersByName(network: string, names: string[])
async function getDataCentersByCountry(network: string, countryCode: string, status?: EnumStatus)
async function getDataCentersByRegion(network: string, regionCode: string, status?: EnumStatus)
```
#### *Storage Node*
```ts
async function isRegisteredNodeName(network: string, name: string)
async function isRegisteredNodeAddress(network: string, didAddress: string)
async function isRegisteredNodeEndpoint(network: string, endpointUri: string)
async function getNodeByName(network: string, name: string)
async function getNodeByAddress(network: string, didAddress: string)
async function getNodeByEndpoint(network: string, endpointUri: string)
async function getNodesByCountry(network: string, countryCode: string, status?: EnumStatus)
async function getNodesByRegion(network: string, regionCode: string, status?: EnumStatus)

async function getBalance(network: string, didAddress: string)
async function excessTokenAmount(network: string, didAddress: string)

async function isStakingRequired(network: string)
async function getStakePerSlot(network: string)
async function getSlotCountRange(network: string)

async function getNodeIssueFee(network: string)
async function getSameNodeLogDuration(network: string)
async function getLogLimitPerDay(network: string)
async function getReasonCodeList(network: string)
async function getReasonCodeDescription(network: string, reasonCode: BigNumberish)
```

## Usage
Import necessary functions from the library and call with NETWORK parameter.

```ts
import { getBalance } from '@verida/vda-node-client'
const result = await getBalance(NETWORK, `<Wallet address>`);
```
