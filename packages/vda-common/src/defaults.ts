import { BlockchainAnchor, EIP1559GasMode, Network } from "@verida/types"
import { RPC_URLS } from "./rpc"

export const DefaultNetworkBlockchainAnchors: Record<Network, BlockchainAnchor> = {
    [Network.LOCAL]: BlockchainAnchor.POLAMOY,
    [Network.DEVNET]: BlockchainAnchor.POLAMOY,
    [Network.BANKSIA]: BlockchainAnchor.POLAMOY,
    [Network.MYRTLE]: BlockchainAnchor.POLPOS
}

export function getWeb3ConfigDefaults(chainName: string): {
    rpcUrl: string | undefined
    eip1559Mode: EIP1559GasMode
    eip1559gasStationUrl: string | undefined
} | null {
    switch (chainName) {
        case 'devnet':
        case 'polamoy':
        case 'testnet':
            return {
                rpcUrl: RPC_URLS[chainName] ?? undefined,
                eip1559Mode: 'fast',
                eip1559gasStationUrl: 'https://gasstation-testnet.polygon.technology/amoy'
            }
        case 'mainnet':
        case 'polpos':
            return {
                rpcUrl: RPC_URLS[chainName] ?? undefined,
                eip1559Mode: 'fast',
                eip1559gasStationUrl: 'https://gasstation.polygon.technology/v2'
            }
        default:
            return null
    }
}
