const assert = require("assert");
import { BigNumber } from 'ethers';
import { isStakingRequired, getStakePerSlot, getSlotCountRange, isWithdrawalEnabled } from '../src/getStakeInfo';

const NETWORK = 'testnet';

describe('getNodes test', function() {
    this.timeout(20000);

    it('isStakingRequired',async () => {
        const result = await isStakingRequired(NETWORK);
        assert.equal(typeof(result), 'boolean', `isStakingRequired return boolean`);
    })

    it('getStakePerSlot',async () => {
        const result: BigNumber = await getStakePerSlot(NETWORK);
        assert.ok(result.gt(0), 'Stake per slot is always greater than 0');
    })

    it('getSlotCountRange',async () => {
        const result = await getSlotCountRange(NETWORK);
        assert.equal(typeof(result), 'object', `SlotCountRange is object`);
    })

    it('isWithdrawalEnabled',async () => {
        const result = await isWithdrawalEnabled(NETWORK);
        assert.equal(typeof(result), 'boolean', `isWithdrawalEnabled return boolean`);
    })
})