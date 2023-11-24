const assert = require("assert");
import { getBalance, excessTokenAmount } from '../src/getBalance';
import { Wallet } from 'ethers';

const NETWORK = 'testnet';

describe('getBalance test', function() {
    this.timeout(20000);
    const wallet = Wallet.createRandom();

    it('getBalance',async () => {
        const result = await getBalance(NETWORK, wallet.address);

        assert.equal(typeof(result), 'object', 'getBalance object');
    })

    it('excessTokenAmount',async () => {
        const result = await excessTokenAmount(NETWORK, wallet.address);

        assert.equal(typeof(result), 'object', 'excessTokenAmount object ');
    })
})