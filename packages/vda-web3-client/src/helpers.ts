/* eslint-disable prettier/prettier */
import { BigNumber } from '@ethersproject/bignumber'

// DID-Registry-Contract address on BSC testnet
export const DEFAULT_REGISTRY_ADDRESS = '0x2862BC860f55D389bFBd1A37477651bc1642A20B'
export const DEFAULT_JSON_RPC = 'http://127.0.0.1:8545/'

export const knownInfuraNetworks: Record<string, string> = {
    mainnet: '0x1',
    ropsten: '0x3',
    rinkeby: '0x4',
    goerli: '0x5',
    kovan: '0x2a',
};

export const knownNetworks: Record<string, string> = {
    // ...knownInfuraNetworks,
    bsc: '0x38',
    bsctestnet: '0x61',
    matic: '0x89',
    maticmum: '0x13881',
};
