const assert = require('assert');
require('dotenv').config();
import { Wallet } from 'ethers';
import { lookup } from '../src/lookup';

const did = {
    address: "0xb362351168D370b174E0fD3Feec93C4E6d2938e2",
}

const NETWORK = 'testnet'

const rpcUrl = process.env.RPC_URL

describe('Lookup test', function() {
    this.timeout(20000)
    it('Failed : Unregistered DID address', async () => {
        const tempDid = Wallet.createRandom();
        await assert.rejects(
            lookup(tempDid.address, NETWORK, rpcUrl),
            {message: 'DID not found'}
        )
    });

    it('Success', async () => {
        // Need to register this did before
        const result = await lookup(did.address, NETWORK, rpcUrl);

        assert.equal(typeof(result), 'object', 'DID Controller is a string')
        assert.ok(result.length > 0, 'Three endpoints returned')
    });
})