2024-02-08 (v0.3.0)
-------------------
- Removed individual files
- Create `VeridaNodeClient` class
- Update test code

2024-02-07 (v0.2.0)
-------------------
- Version reset as 0.2.0
- Updates on review

2024-01-25 (v1.2.0)
-------------------
- Added a function
```ts
async function isWithdrawalEnabled(network: string)
```

2023-12-15 (v1.1.0)
-------------------
- Updated the code structure
- Added functions
```ts
async function getReasonCodeList(network: string)
async function getReasonCodeDescription(network: string, reasonCode: BigNumberish)
async function isRegisteredNodeName(network: string, name: string)
async function isRegisteredNodeAddress(network: string, didAddress: string)
async function isRegisteredNodeEndpoint(network: string, endpointUri: string)
async function getNodeByName(network: string, name: string)
```
- Updated functions
```ts
async function getDataCentresByCountry(network: string, countryCode: string, status?: EnumStatus)
async function getDataCentresByRegion(network: string, regionCode: string, status?: EnumStatus)

async function getNodesByCountry(network: string, countryCode: string, status?: EnumStatus)
async function getNodesByRegion(network: string, regionCode: string, status?: EnumStatus)
```
- Test code updated

2023-11-24 (v1.0.0)
-------------------
- Initial release