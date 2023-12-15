const assert = require("assert");
import { getContractDecimal } from '../src/getContractDecimal';
import { Wallet } from 'ethers';

const NETWORK = 'testnet';

describe('getContractDecimal test', function() {
    this.timeout(20000);

    it('Success',async () => {
        const result = await getContractDecimal(NETWORK);

        assert.equal(typeof(result), 'number', 'getContractDecimal number');
    })
})