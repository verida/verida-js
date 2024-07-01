import { BlockchainAnchor, Network } from "@verida/types";
import { NetworkDefinition } from "@verida/types";

export interface CONTRACT_INFO {
    abi: any,
    address: string
}

const MAINNET = BlockchainAnchor.POLPOS.toString()
const TESTNET = BlockchainAnchor.POLAMOY.toString()
const DEVNET = BlockchainAnchor.POLAMOY.toString()

export const NETWORK_DEFINITIONS: Record<Network, NetworkDefinition> = {
    [Network.MYRTLE]: {
        id: Network.MYRTLE,
        label: "Myrtle",
        isMainnet: true,
        anchoredBlockchain: BlockchainAnchor.POLPOS,
        tokenAddress: "0x683565196C3EAb450003C964D4bad1fd3068D4cC",
        didRegistry: "0x6FF180EF62FA57e611E91bdDaDadB6635D6b9Af7",
        storageNodeRegistryAddress: null,
        nameRegistryAddress: "0xc9ce048b464034C53207Bf120bF85f317fdb38C8",
        didLinkageAddress: "0x5916F97e31B77884d81bdA875b7686A988E0d517",
        vdaRewardContract: ""
    },
    [Network.BANKSIA]: {
        id: Network.BANKSIA,
        label: "Banksia",
        isMainnet: false,
        anchoredBlockchain: BlockchainAnchor.POLAMOY,
        tokenAddress: "0xC3D1eB4E0241a4A2B859f91dd2a6aDA176cCB6F2",
        didRegistry: "0x5CC5cf757C0f2af7b3935093F88EaF45c5210002",
        storageNodeRegistryAddress: "0x4Fa02CA7fD115b4cCA7F80Cb3047550648c360e1",
        nameRegistryAddress: "0x7f0c4feE1553323668d3d597270D9b525D20d719",
        didLinkageAddress: "0x3A2439746D84bF4a8416fAfbF9C864Fc380BA23B",
        vdaRewardContract: "0x08Dbf7A77A46Feac30AAf834Bf078722949fE9FB"
    },
    [Network.DEVNET]: {
        id: Network.DEVNET,
        label: "Devnet",
        isMainnet: false,
        anchoredBlockchain: BlockchainAnchor.POLAMOY,
        tokenAddress: "0xC3D1eB4E0241a4A2B859f91dd2a6aDA176cCB6F2",
        didRegistry: "0x5CC5cf757C0f2af7b3935093F88EaF45c5210002",
        storageNodeRegistryAddress: "0x4Fa02CA7fD115b4cCA7F80Cb3047550648c360e1",
        nameRegistryAddress: "0x7f0c4feE1553323668d3d597270D9b525D20d719",
        didLinkageAddress: "0x3A2439746D84bF4a8416fAfbF9C864Fc380BA23B",
        vdaRewardContract: "0x08Dbf7A77A46Feac30AAf834Bf078722949fE9FB"
    },
    [Network.LOCAL]: {
        id: Network.LOCAL,
        label: "Local",
        isMainnet: false,
        anchoredBlockchain: BlockchainAnchor.POLAMOY,
        tokenAddress: "0xC3D1eB4E0241a4A2B859f91dd2a6aDA176cCB6F2",
        didRegistry: "0x5CC5cf757C0f2af7b3935093F88EaF45c5210002",
        storageNodeRegistryAddress: "0x4Fa02CA7fD115b4cCA7F80Cb3047550648c360e1",
        nameRegistryAddress: "0x7f0c4feE1553323668d3d597270D9b525D20d719",
        didLinkageAddress: "0x3A2439746D84bF4a8416fAfbF9C864Fc380BA23B",
        vdaRewardContract: "0x08Dbf7A77A46Feac30AAf834Bf078722949fE9FB"
    },
}

export function getNetworkFromString(networkName: string): Network {
    return Network[networkName.toUpperCase() as keyof typeof Network];
}

export const BLOCKCHAIN_CHAINIDS: Record<BlockchainAnchor, string> = {
    [BlockchainAnchor.POLPOS]: '0x89',
    [BlockchainAnchor.POLAMOY]: '0x13882'
}

const CHAINID_MAINNET = BLOCKCHAIN_CHAINIDS[BlockchainAnchor.POLPOS].toString()
const CHAINID_TESTNET = BLOCKCHAIN_CHAINIDS[BlockchainAnchor.POLAMOY].toString()

export type CONTRACT_NAMES = 
    "VeridaDIDRegistry"     |
    "NameRegistry"          |
    "SoulboundNFT"          |

    "VeridaDIDLinkage"      |
    "VeridaToken"           |
    "VDARewardContract"     |
    "StorageNodeRegistry"
    ;

/**
 * @todo Deprecate in favour of `NETWORK_DEFINITIONS`
 */
export const CONTRACT_ADDRESS : Record<CONTRACT_NAMES, Record<string, string | null>> = {
    "VeridaDIDRegistry": {
        [MAINNET]: NETWORK_DEFINITIONS[Network.MYRTLE].didRegistry,
        [CHAINID_MAINNET]: NETWORK_DEFINITIONS[Network.MYRTLE].didRegistry,
        [TESTNET]: NETWORK_DEFINITIONS[Network.BANKSIA].didRegistry,
        [CHAINID_TESTNET]: NETWORK_DEFINITIONS[Network.BANKSIA].didRegistry,
        [DEVNET]: NETWORK_DEFINITIONS[Network.BANKSIA].didRegistry,
    },
    "NameRegistry": {
        [MAINNET]: NETWORK_DEFINITIONS[Network.MYRTLE].nameRegistryAddress,
        [CHAINID_MAINNET]: NETWORK_DEFINITIONS[Network.MYRTLE].nameRegistryAddress,
        [TESTNET]: NETWORK_DEFINITIONS[Network.BANKSIA].nameRegistryAddress,
        [CHAINID_TESTNET]: NETWORK_DEFINITIONS[Network.BANKSIA].nameRegistryAddress,
        [DEVNET]: NETWORK_DEFINITIONS[Network.BANKSIA].nameRegistryAddress,
    },
    /**
     * @todo: Remove from vda-common
     * 
     * Not really part of the protocol, so not a defined in NETWORK_DEFINITIONS and should be removed
     */
    "SoulboundNFT" : {
        [MAINNET]: "0xB500418b5F47758903Ae02bfB3605cBd19062889",
        "0x89": "0xB500418b5F47758903Ae02bfB3605cBd19062889",
        [TESTNET]: "0xa7D552ccc8E561164d26711516033bcdeD975ca3",
        "0x13881": "0xa7D552ccc8E561164d26711516033bcdeD975ca3",
        [DEVNET]: "0xa7D552ccc8E561164d26711516033bcdeD975ca3",
    },
    "VeridaDIDLinkage" : {
        [MAINNET]: NETWORK_DEFINITIONS[Network.MYRTLE].didLinkageAddress,
        [CHAINID_MAINNET]:  NETWORK_DEFINITIONS[Network.MYRTLE].didLinkageAddress,
        [TESTNET]:  NETWORK_DEFINITIONS[Network.BANKSIA].didLinkageAddress,
        [CHAINID_TESTNET]:  NETWORK_DEFINITIONS[Network.BANKSIA].didLinkageAddress,
        [DEVNET]:  NETWORK_DEFINITIONS[Network.BANKSIA].didLinkageAddress,
    },
    "VeridaToken" : {
        [MAINNET]: NETWORK_DEFINITIONS[Network.MYRTLE].tokenAddress,
        [CHAINID_MAINNET]: NETWORK_DEFINITIONS[Network.MYRTLE].tokenAddress,
        [TESTNET]: NETWORK_DEFINITIONS[Network.BANKSIA].tokenAddress,
        [CHAINID_TESTNET]: NETWORK_DEFINITIONS[Network.BANKSIA].tokenAddress,
        [DEVNET]: NETWORK_DEFINITIONS[Network.BANKSIA].tokenAddress,
    },
    /**
     * @todo: Remove from vda-common
     * 
     * Not really part of the protocol, so not a defined in NETWORK_DEFINITIONS and should be removed
     */
    "VDARewardContract": {
        [MAINNET]: null,
        [CHAINID_MAINNET]: null,
        [TESTNET]: NETWORK_DEFINITIONS[Network.BANKSIA].vdaRewardContract,
        [CHAINID_TESTNET]: NETWORK_DEFINITIONS[Network.BANKSIA].vdaRewardContract,
        [DEVNET]: NETWORK_DEFINITIONS[Network.BANKSIA].vdaRewardContract
    },
    "StorageNodeRegistry": {
        [MAINNET]: null,
        [CHAINID_MAINNET]: null,
        [TESTNET]: NETWORK_DEFINITIONS[Network.BANKSIA].storageNodeRegistryAddress,
        [CHAINID_TESTNET]: NETWORK_DEFINITIONS[Network.BANKSIA].storageNodeRegistryAddress,
        [DEVNET]: NETWORK_DEFINITIONS[Network.BANKSIA].storageNodeRegistryAddress
    }
};

export const CONTRACT_ABI : Record<CONTRACT_NAMES, any> = {
    "VeridaDIDRegistry": require('./abi/VeridaDIDRegistry.json'),
    "NameRegistry": require('./abi/NameRegistry.json'),
    "SoulboundNFT": require('./abi/SoulboundNFT.json'),
    "VeridaDIDLinkage": require('./abi/VeridaDIDLinkage.json'),
    "VeridaToken": require('./abi/VeridaToken.json'),
    "VDARewardContract": require('./abi/VDARewardContract.json'),
    "StorageNodeRegistry": require('./abi/StorageNodeRegistry.json'),
}

export function getContractInfoForBlockchain(name: CONTRACT_NAMES, blockchain: BlockchainAnchor) : CONTRACT_INFO {
    const abi = CONTRACT_ABI[name];
    if (!abi) {
        throw new Error(`Contract ABI does not exist (${name} / ${blockchain})`)
    }

    const address = CONTRACT_ADDRESS[name][blockchain.toString()];

    if (!address) {
        throw new Error(`Contract address (${name}) not defined for blockchain: ${blockchain.toString()}`);
    }

    return {
        abi: abi,
        address: <string>address
    }
}

export function getContractInfoForVeridaNetwork(name: CONTRACT_NAMES, network: Network) : CONTRACT_INFO {
    const abi = CONTRACT_ABI[name];
    if (!abi) {
        throw new Error(`Contract ABI does not exist (${name} / ${network})`)
    }

    const networkDefinition = NETWORK_DEFINITIONS[network]
    const address = CONTRACT_ADDRESS[name][networkDefinition.anchoredBlockchain.toString()];

    if (!address) {
        throw new Error(`Contract address (${name}) is not defined for blockchain: ${networkDefinition.id}`);
    }

    return {
        abi: abi,
        address: <string>address
    }
}