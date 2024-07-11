import { IContractInfo, INetworkContracts } from "@verida/types";
import { BlockchainAnchor, Network, TContractNames } from "@verida/types";
import { NetworkDefinition } from "@verida/types";

export const CONTRACT_ABI : Record<TContractNames, any> = {
    didRegistry: require('./abi/VeridaDIDRegistry.json'),
    nameRegistry: require('./abi/NameRegistry.json'),
    didLinkage: require('./abi/VeridaDIDLinkage.json'),
    token: require('./abi/VeridaToken.json'),
    reward: require('./abi/VDARewardContract.json'),
    storageNodeRegistry: require('./abi/StorageNodeRegistry.json'),
    solboundNFT: require('./abi/SoulboundNFT.json'),
}

/**
 * Contract information for each `BlockchainAnchor` type
 */
export const CHAIN_CONTRACTS : Record<BlockchainAnchor, INetworkContracts> = {
    polpos: {
        token: {
            address: "0x683565196C3EAb450003C964D4bad1fd3068D4cC",
            abi: CONTRACT_ABI["token"]
        },
        didRegistry: {
            address: "0x6FF180EF62FA57e611E91bdDaDadB6635D6b9Af7",
            abi: CONTRACT_ABI["didRegistry"]
        },
        storageNodeRegistry: null,
        nameRegistry: {
            address: "0xc9ce048b464034C53207Bf120bF85f317fdb38C8",
            abi: CONTRACT_ABI["nameRegistry"]
        },
        didLinkage: {
            address: "0x5916F97e31B77884d81bdA875b7686A988E0d517",
            abi: CONTRACT_ABI["didLinkage"]
        },
        reward: null,
        solboundNFT: null
    },
    polamoy: {
        token: {
            address: "0xC3D1eB4E0241a4A2B859f91dd2a6aDA176cCB6F2",
            abi: CONTRACT_ABI["token"]
        },
        didRegistry: {
            address: "0x5CC5cf757C0f2af7b3935093F88EaF45c5210002",
            abi: CONTRACT_ABI["didRegistry"]
        },
        storageNodeRegistry: {
            address: "0xb19197875f4e76db9565c32E98e588F6A215ceb5",
            abi: CONTRACT_ABI["storageNodeRegistry"]
        },
        nameRegistry: {
            address: "0x91381c424485dc12650811601d9a8B0025e51afc",
            abi: CONTRACT_ABI["nameRegistry"]
        },
        didLinkage: {
            address: "0x3A2439746D84bF4a8416fAfbF9C864Fc380BA23B",
            abi: CONTRACT_ABI["didLinkage"]
        },
        reward: {
            address: "0x4BDf0193aF01dF6b6Ff14A97eECE42071575d706",
            abi: CONTRACT_ABI["reward"]
        },
        solboundNFT: {
            address: "0xa7D552ccc8E561164d26711516033bcdeD975ca3",
            abi: CONTRACT_ABI["solboundNFT"]
        }
    }
}

export const NETWORK_DEFINITIONS: Record<Network, NetworkDefinition> = {
    [Network.MYRTLE]: {
        id: Network.MYRTLE,
        label: "Myrtle",
        isMainnet: true,
        anchoredBlockchain: BlockchainAnchor.POLPOS,
        ...CHAIN_CONTRACTS[BlockchainAnchor.POLPOS]
    },
    [Network.BANKSIA]: {
        id: Network.BANKSIA,
        label: "Banksia",
        isMainnet: false,
        anchoredBlockchain: BlockchainAnchor.POLAMOY,
        ...CHAIN_CONTRACTS[BlockchainAnchor.POLAMOY]
    },
    [Network.DEVNET]: {
        id: Network.DEVNET,
        label: "Devnet",
        isMainnet: false,
        anchoredBlockchain: BlockchainAnchor.POLAMOY,
        ...CHAIN_CONTRACTS[BlockchainAnchor.POLAMOY]
    },
    [Network.LOCAL]: {
        id: Network.LOCAL,
        label: "Local",
        isMainnet: false,
        anchoredBlockchain: BlockchainAnchor.POLAMOY,
        ...CHAIN_CONTRACTS[BlockchainAnchor.POLAMOY]
    },
}

export function getNetworkFromString(networkName: string): Network {
    return Network[networkName.toUpperCase() as keyof typeof Network];
}

export const BLOCKCHAIN_CHAINIDS: Record<BlockchainAnchor, string> = {
    [BlockchainAnchor.POLPOS]: '0x89',
    [BlockchainAnchor.POLAMOY]: '0x13882'
}

/**
 * Return the contract information for given `BlockchainAnchor`
 * @param blockchainAnchor Target chain that Verida support {@link BlockchainAnchor}
 * @param contractName Contract name {@link TContractNames}
 */
export function getContractInfoForBlockchainAnchor(blockchainAnchor: BlockchainAnchor, contractName: TContractNames) : IContractInfo {
    return CHAIN_CONTRACTS[blockchainAnchor][contractName]!;
}