import { RPC_URLS } from "./rpc"

export function getWeb3ConfigDefaults(chainName: string) {
    switch (chainName) {
        case 'devnet':
            return {
                rpcUrl: RPC_URLS[chainName],
                eip1559Mode: 'fast',
                eip1559gasStationUrl: 'https://gasstation-testnet.polygon.technology/v2'
            }
        case 'testnet':
            return {
                rpcUrl: RPC_URLS[chainName],
                eip1559Mode: 'fast',
                eip1559gasStationUrl: 'https://gasstation-testnet.polygon.technology/v2'
            }
        case 'mainnet':
            return {
                rpcUrl: RPC_URLS[chainName],
                eip1559Mode: 'fast',
                eip1559gasStationUrl: 'https://gasstation.polygon.technology/v2'
            }
    }
}