const assert = require('assert')
import { getDIDs } from '../src/getDIDs';

const NETWORK = 'testnet'

describe('getDIDs test', function() {
    this.timeout(20000)
    
    it('Get first 20 created DIDs', async () => {
        const result = await getDIDs(NETWORK, 0, 20);

        assert.ok(result, 'Have a result')
        assert.ok(result.length, 'Have at least one result returned')
        console.log(result)
    });
})