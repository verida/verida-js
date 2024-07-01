const assert = require('assert')
import { BlockchainAnchor } from '@verida/types';
import { activeDIDCount } from '../src/activeDIDCount';

describe('activeDIDCount test', function() {
    this.timeout(20000)
    
    it('Success', async () => {
        // Need to register this did before
        const result = await activeDIDCount(BlockchainAnchor.POLAMOY);

        assert.equal(typeof(result), 'number', 'activeDIDCount number')
        console.log("Current count = ", result)
    });
})