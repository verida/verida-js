const assert = require("assert");
import { EnumStatus } from '@verida/types';
import { isRegisteredDataCenterName, getDataCenters, getDataCentersByName, getDataCentersByCountry, getDataCentersByRegion } from '../src/getDataCenters';
import { REGISTERED_DATACENTERS, REMOVED_DATACENTERS } from '@verida/vda-common-test';

const NETWORK = 'testnet';

describe('getDataCenters test', function() {
    this.timeout(20000);

    it('isRegisteredDataCenterName',async () => {
        const result = await isRegisteredDataCenterName(NETWORK, "InvalidName");

        assert.equal(result, false, "False for invalid data center name");
    })

    it('get data centers by ids',async () => {
        // Rejected for invalid ids
        try {
            await getDataCenters(NETWORK, [1, 0, 2]);
        } catch (e) {
            assert.ok(e !== undefined, "Rejected");
        }

        // Success
        const result = await getDataCenters(NETWORK, [1]);
        assert.equal(typeof(result), 'object', "getDataCenters object");
    })

    it('get data centers by name',async () => {
        const names = REGISTERED_DATACENTERS.map((item) => item.name);

        // Rejected for invalid ids
        try {
            await getDataCentersByName(NETWORK, ["Invalid", ...names]);
        } catch (e) {
            assert.ok(e !== undefined, "Rejected");
        }

        // Success
        const result = await getDataCentersByName(NETWORK, [...names]);
        assert.equal(typeof(result), 'object', "getDataCentersByName object");
    })

    it('get data centers by country and status',async () => {
        const countryList = REGISTERED_DATACENTERS.map(item => item.countryCode);
        const countries = [...new Set(countryList)];

        // Get without status
        for (let i = 0; i < countries.length; i++) {
            const result = await getDataCentersByCountry(NETWORK, countries[i]);
            assert.ok(result.length > 0, 'getDataCentersByCountry array');
        }

        // Get with status
        const removedCountryCode = REMOVED_DATACENTERS[0].countryCode;
        const result = await getDataCentersByCountry(NETWORK, removedCountryCode, EnumStatus.removed);
        
        assert.ok(result.length > 0, 'Get removed datacenters');
    })

    
    it('get data centers by region and status',async () => {
        const regionList = REGISTERED_DATACENTERS.map(item => item.regionCode);
        const regions = [...new Set(regionList)];

        // Get without status
        for (let i = 0; i < regions.length; i++) {
            const result = await getDataCentersByRegion(NETWORK, regions[i]);
            assert.ok(result.length > 0, 'getDataCentersByRegion array');
        }

        // Get with status
        const removedRegionCode = REMOVED_DATACENTERS[0].regionCode;
        const result = await getDataCentersByRegion(NETWORK, removedRegionCode, EnumStatus.removed);
        assert.ok(result.length > 0, 'Get removed datacenters');
    })

})