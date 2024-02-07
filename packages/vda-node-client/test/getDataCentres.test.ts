const assert = require("assert");
import { EnumStatus } from '@verida/types';
import { isRegisteredDataCentreName, getDataCentresById, getDataCentresByName, getDataCentresByCountryCode, getDataCentresByRegionCode } from '../src/getDataCentres';
import { REGISTERED_DATACENTRES, REMOVED_DATACENTRES } from '@verida/vda-common-test';

const NETWORK = 'testnet';

describe('getDataCentres test', function() {
    this.timeout(20000);

    it('isRegisteredDataCentreName',async () => {
        const result = await isRegisteredDataCentreName(NETWORK, "InvalidName");

        assert.equal(result, false, "False for invalid data centre name");
    })

    it('get data centres by ids',async () => {
        // Rejected for invalid ids
        try {
            await getDataCentresById(NETWORK, [1, 0, 2]);
        } catch (e) {
            assert.ok(e !== undefined, "Rejected");
        }

        // Success
        const result = await getDataCentresById(NETWORK, [1]);
        assert.equal(typeof(result), 'object', "getDataCentres object");
    })

    it('get data centres by name',async () => {
        const names = REGISTERED_DATACENTRES.map((item) => item.name);

        // Rejected for invalid ids
        try {
            await getDataCentresByName(NETWORK, ["Invalid", ...names]);
        } catch (e) {
            assert.ok(e !== undefined, "Rejected");
        }

        // Success
        const result = await getDataCentresByName(NETWORK, [...names]);
        assert.equal(typeof(result), 'object', "getDataCentresByName object");
    })

    it('get data centres by country code and status',async () => {
        const countryList = REGISTERED_DATACENTRES.map(item => item.countryCode);
        const countries = [...new Set(countryList)];

        // Get without status
        for (let i = 0; i < countries.length; i++) {
            const result = await getDataCentresByCountryCode(NETWORK, countries[i]);
            assert.ok(result.length > 0, 'getDataCentresByCountryCode array');
        }

        // Get with status
        const removedCountryCode = REMOVED_DATACENTRES[0].countryCode;
        const result = await getDataCentresByCountryCode(NETWORK, removedCountryCode, EnumStatus.removed);
        
        assert.ok(result.length > 0, 'Get removed datacentres');
    })

    
    it('get data centres by region code and status',async () => {
        const regionList = REGISTERED_DATACENTRES.map(item => item.regionCode);
        const regions = [...new Set(regionList)];

        // Get without status
        for (let i = 0; i < regions.length; i++) {
            const result = await getDataCentresByRegionCode(NETWORK, regions[i]);
            assert.ok(result.length > 0, 'getDataCentresByRegionCode array');
        }

        // Get with status
        const removedRegionCode = REMOVED_DATACENTRES[0].regionCode;
        const result = await getDataCentresByRegionCode(NETWORK, removedRegionCode, EnumStatus.removed);
        assert.ok(result.length > 0, 'Get removed datacentres');
    })

})