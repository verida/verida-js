import { BlockchainAnchor, EnvironmentType } from "@verida/types"
import { RPC_URLS } from "./rpc"

export const DefaultEnvironmentBlockchainAnchors: Record<EnvironmentType, BlockchainAnchor> = {
    [EnvironmentType.LOCAL]: BlockchainAnchor.MUMBAI,
    [EnvironmentType.DEVNET]: BlockchainAnchor.MUMBAI,
    [EnvironmentType.BANKSIA]: BlockchainAnchor.MUMBAI,
    [EnvironmentType.MYRTLE]: BlockchainAnchor.POLPOS
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