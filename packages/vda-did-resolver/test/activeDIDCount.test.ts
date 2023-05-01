const assert = require('assert')
import { activeDIDCount } from '../src/activeDIDCount';


const NETWORK = 'testnet'

const rpcUrl = "https://rpc-mumbai.maticvigil.com";

describe('activeDIDCount test', function() {
    this.timeout(20000)
    
    it('Success', async () => {
        // Need to register this did before
        const result = await activeDIDCount(NETWORK, rpcUrl);

        assert.equal(typeof(result), 'number', 'activeDIDCount number')
        console.log("Current count = ", result)
    });
})