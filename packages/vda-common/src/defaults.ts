import { BlockchainAnchor, Network } from "@verida/types"
import { RPC_URLS } from "./rpc"

export const DefaultNetworkBlockchainAnchors: Record<Network, BlockchainAnchor> = {
    [Network.LOCAL]: BlockchainAnchor.POLAMOY,
    [Network.DEVNET]: BlockchainAnchor.POLAMOY,
    [Network.BANKSIA]: BlockchainAnchor.POLAMOY,
    [Network.MYRTLE]: BlockchainAnchor.POLPOS
}

export function getWeb3ConfigDefaults(chainName: string) {
    switch (chainName) {
        case 'devnet':
        case 'polamoy':
        case 'testnet':
            return {
                rpcUrl: RPC_URLS[chainName],
                eip1559Mode: 'fast',
                eip1559gasStationUrl: 'https://gasstation-testnet.polygon.technology/amoy'
            }
        case 'mainnet':
        case 'polpos':
            return {
                rpcUrl: RPC_URLS[chainName],
                eip1559Mode: 'fast',
                eip1559gasStationUrl: 'https://gasstation.polygon.technology/v2'
            }
    }
}