const assert = require("assert");
import { getVDATokenAddress } from '../src/getVDATokenAddress';

const NETWORK = 'testnet';

describe('getVDATokenAddress test', function() {
    this.timeout(20000);

    it('Success',async () => {
        const result = await getVDATokenAddress(NETWORK);

        assert.equal(typeof(result), 'string', 'getVDATokenAddress string');
    })
})