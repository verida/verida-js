2024-01-25 (v1.0.0)
-------------------
- Enable/disable withdrawal feature added
- Added `depositTokenFromProvider()` function
- Added `recipient` parameter in the `withdraw()` and `removeNodeComplete()` functions
- Test code updated to test with/without token minting operation
- `ReadMe.md` updated for test

2023-12-15 (v1.0.0)
-------------------
- Added following functions to `src/ownerApi.ts`
```ts
public async addReasonCode(reasonCode: BigNumberish, description: string)
public async disableReasonCode(reasonCode: BigNumberish)
public async updateReasonCodeDescription(reasonCode: BigNumberish, description: string)
```
- Added following functions to `src/userApi.ts`
```ts
public async getVDATokenAddress()
public async isRegisteredNodeName(name: string)
public async isRegisteredNodeAddress(didAddress = this.didAddress)
public async isRegisteredNodeEndpoint(endpointUri: string)
public async getNodeByName(name: string)
public async getReasonCodeDescription(code: BigNumberish)
public async getReasonCodeList()
```
- Updated following functions in `src/userApi.ts`
```ts
public async isRegisteredDataCenterName(name: string)
public async getDataCentersByCountry(countryCode: string, status?: EnumStatus)
public async getDataCentersByRegion(regionCode: string, status?: EnumStatus)
public async addNode(...)
public async removeNodeStart(unregisterDateTime: BigNumberish, fallbackInfo: IFallbackNodeInfo)
public async removeNodeComplete(fallbackMigrationProof: BytesLike)
private async standardizeNode(data: any)
public async getNodeByEndpoint(endpointUri: string)
public async getNodesByCountry(countryCode: string, status?: EnumStatus)
public async getNodesByRegion(regionCode: string, status?: EnumStatus)
```
- Updated test codes

2023-11-24 (v1.0.0)
-------------------
- Initial release