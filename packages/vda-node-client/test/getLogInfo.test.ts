const assert = require("assert");
import { BigNumber } from 'ethers';
import { getNodeIssueFee, getSameNodeLogDuration, getLogLimitPerDay, getReasonCodeList, getReasonCodeDescription } from '../src/getLogInfos';

const NETWORK = 'testnet';

describe('getLogInfo test', function() {
    this.timeout(20000);

    it('getNodeIssueFee',async () => {
        const result: BigNumber = await getNodeIssueFee(NETWORK);

        assert.ok(result.gt(0), 'Logging node issue fee is always greater than 0')
    })

    it('getSameNodeLogDuration',async () => {
        const result: BigNumber = await getSameNodeLogDuration(NETWORK);

        assert.ok(result.gt(0), 'Log duration for same node is always greater than 0')
    })

    it('getLogLimitPerDay',async () => {
        const result: BigNumber = await getLogLimitPerDay(NETWORK);

        assert.ok(result.gt(0), 'Log limit per day is always greater than 0')
    })

    it('getReasonCodeList',async () => {
        const result = await getReasonCodeList(NETWORK);

        assert.ok(result.length > 0, 'Get reason code list')
    })

    it('getReasonCodeDescription',async () => {
        const reasonCodeList = await getReasonCodeList(NETWORK);

        const description = await getReasonCodeDescription(NETWORK, reasonCodeList[0].reasonCode);
        assert.ok(typeof(description) === 'string', 'Get description of reason code')
    })
})