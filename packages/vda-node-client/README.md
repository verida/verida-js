
# VDA Node Client
A client library that read nodat & datacentre information.
This library calls only read functions of `vda-node-manager` package.

## Installation

```
yarn add @verida/vda-node-client

```

## Usage
This library provides the `VeridaNodeClient` class.
Users can create `VeridaNodeClient` with or without RPC_URLS
### Create without RPC_URL
```ts
import { VeridaNodeClient } from '@verida/vda-node-client'
const nodeClient = VeridaNodeClient("testnet");
```
### Create with RPC_URL
```ts
import { VeridaNodeClient } from '@verida/vda-node-client'
const nodeClient = VeridaNodeClient("testnet", "<Input your RPC_URL>");
```

## Function List
The `VeridaNodeClient` class provide following function list:

#### *Contract Decimal for Latitude and Longitude*
```ts
public async getContractDecimal(network: string): Promise<number>
```
#### *Get Verida Token address*
```ts
public async getVDATokenAddress(network: string): Promise<string>
```
#### *Data Centres*
```ts
public async isRegisteredDataCentreName(network: string, name: string)
public async getDataCentresById(network: string, ids: BigNumberish[])
public async getDataCentresByName(network: string, names: string[])
public async getDataCentresByCountryCode(network: string, countryCode: string, status?: EnumStatus)
public async getDataCentresByRegionCode(network: string, regionCode: string, status?: EnumStatus)
```
#### *Storage Node*
```ts
public async isRegisteredNodeName(network: string, name: string)
public async isRegisteredNodeAddress(network: string, didAddress: string)
public async isRegisteredNodeEndpoint(network: string, endpointUri: string)
public async getNodeByName(network: string, name: string)
public async getNodeByAddress(network: string, didAddress: string)
public async getNodeByEndpoint(network: string, endpointUri: string)
public async getNodesByCountryCode(network: string, countryCode: string, status?: EnumStatus)
public async getNodesByRegionCode(network: string, regionCode: string, status?: EnumStatus)
public async getNodesByStatus(status: EnumStatus)

public async getBalance(network: string, didAddress: string)
public async excessTokenAmount(network: string, didAddress: string)

public async isStakingRequired(network: string)
public async isWithdrawalEnabled()
public async getStakePerSlot(network: string)
public async getSlotCountRange(network: string)

public async getNodeIssueFee(network: string)
public async getSameNodeLogDuration(network: string)
public async getLogLimitPerDay(network: string)
public async getReasonCodeList(network: string)
public async getReasonCodeDescription(network: string, reasonCode: BigNumberish)
```
