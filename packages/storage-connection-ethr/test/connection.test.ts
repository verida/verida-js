'use strict'
const assert = require('assert')

import { StorageConnectionEthr } from '../src/index'
//import { ethers } from 'ethers'

describe('Ethereum connection', () => {
    it('can instantiate', async function() {
        const privateKey = '0xaa0123456789aa0123456789aa0123456789'

        const connection = new StorageConnectionEthr({ privateKey })
        console.log(connection)
        assert(true, true, 'is true')
    });
});
