const assert = require('assert')
import { interpretIdentifier } from '../src/utils';
import { BlockchainAnchor } from '@verida/types';

describe('Interpret identifier test', function() {
    it('Handles old DID formats', async () => {
        const dids = {
            'did:vda:mainnet:0xCDEdd96AfA6956f0299580225C2d9a52aca8487A': {
                'network': BlockchainAnchor.POLPOS,
                'address': '0xCDEdd96AfA6956f0299580225C2d9a52aca8487A'
            },
            'did:vda:testnet:0x158672345D2486a148313c6b107857A64ff6b477': {
                'network': BlockchainAnchor.POLAMOY,
                'address': '0x158672345D2486a148313c6b107857A64ff6b477'
            }
        };

        Object.keys(dids).forEach((did: string) => {
            const result = interpretIdentifier(did);
            assert.equal(result.network, dids[did].network, 'Network matches');
            assert.equal(result.address, dids[did].address, 'Address matches')
        });
    });

    it('Handles new DID formats', async () => {
        const dids = {
            'did:vda:polpos:0xCDEdd96AfA6956f0299580225C2d9a52aca8487A': {
                'network': BlockchainAnchor.POLPOS,
                'address': '0xCDEdd96AfA6956f0299580225C2d9a52aca8487A'
            },
            'did:vda:polamoy:0x158672345D2486a148313c6b107857A64ff6b477': {
                'network': BlockchainAnchor.POLAMOY,
                'address': '0x158672345D2486a148313c6b107857A64ff6b477'
            }
        };

        Object.keys(dids).forEach((did: string) => {
            const result = interpretIdentifier(did);
            assert.equal(result.network, dids[did].network, 'Network matches');
            assert.equal(result.address, dids[did].address, 'Address matches')
        });
    });
});