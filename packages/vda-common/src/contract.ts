import { BlockchainAnchor, Network } from "@verida/types";
import { mapDidNetworkToBlockchainAnchor } from "./utils";
import { NetworkDefinition } from "@verida/types";

export interface CONTRACT_INFO {
    abi: any,
    address: string
}

const MYRTLE = Network.MYRTLE
const BANKSIA = Network.BANKSIA

const MAINNET = BlockchainAnchor.MAINNET.toString()
const TESTNET = BlockchainAnchor.TESTNET.toString()
const DEVNET = BlockchainAnchor.DEVNET.toString()

export const NETWORK_DEFINITIONS: Record<Network, NetworkDefinition> = {
    [MYRTLE]: {
        id: Network.MYRTLE,
        label: "Myrtle",
        isMainnet: true,
        anchoredBlockchain: BlockchainAnchor.POLPOS,
        tokenAddress: "0x683565196C3EAb450003C964D4bad1fd3068D4cC",
        storageNodeRegistryAddress: null,
        nameRegistryAddress: "0xc9ce048b464034C53207Bf120bF85f317fdb38C8",
        didLinkageAddress: "0x5916F97e31B77884d81bdA875b7686A988E0d517"
    },
    [BANKSIA]: {
        id: Network.BANKSIA,
        label: "Banksia",
        isMainnet: false,
        anchoredBlockchain: BlockchainAnchor.POLAMOY,
        tokenAddress: "0x745Db51351015d61573db37bC16C49B8506B93c8",
        storageNodeRegistryAddress: "0x044B2D754923e529A780eFcc085B03ee022e3364",
        nameRegistryAddress: "0x1dD6AAc1858100091BEbb867C7628DA639F7C16E",
        didLinkageAddress: "0xF394a23dc6777cAB3067566F27Ec5bdDD2D0bD2A"
    },
    [Network.DEVNET]: {
        id: Network.DEVNET,
        label: "Banksia",
        isMainnet: false,
        anchoredBlockchain: BlockchainAnchor.POLAMOY,
        tokenAddress: "0x745Db51351015d61573db37bC16C49B8506B93c8",
        storageNodeRegistryAddress: "0x044B2D754923e529A780eFcc085B03ee022e3364",
        nameRegistryAddress: "0x1dD6AAc1858100091BEbb867C7628DA639F7C16E",
        didLinkageAddress: "0xF394a23dc6777cAB3067566F27Ec5bdDD2D0bD2A"
    },
    [Network.LOCAL]: {
        id: Network.LOCAL,
        label: "Local",
        isMainnet: false,
        anchoredBlockchain: BlockchainAnchor.POLAMOY,
        tokenAddress: "0x745Db51351015d61573db37bC16C49B8506B93c8",
        storageNodeRegistryAddress: "0x044B2D754923e529A780eFcc085B03ee022e3364",
        nameRegistryAddress: "0x1dD6AAc1858100091BEbb867C7628DA639F7C16E",
        didLinkageAddress: "0xF394a23dc6777cAB3067566F27Ec5bdDD2D0bD2A"
    },
}

export const BLOCKCHAIN_CHAINIDS: Record<BlockchainAnchor, string> = {
    [BlockchainAnchor.POLPOS]: '0x89',
    [BlockchainAnchor.POLAMOY]: '0x13882',
    [BlockchainAnchor.MUMBAI]: '0x13881',

    /**
     * @todo Deprecate
     */
    [BlockchainAnchor.MAINNET]: '0x89',

    /**
     * @todo Deprecate
     */
    [BlockchainAnchor.TESTNET]: '0x13881',

    /**
     * @todo Switch to `polamoy`
     */
    [BlockchainAnchor.DEVNET]: '0x13881'
}

const CHAINID_MAINNET = BLOCKCHAIN_CHAINIDS[BlockchainAnchor.MAINNET].toString()
const CHAINID_TESTNET = BLOCKCHAIN_CHAINIDS[BlockchainAnchor.TESTNET].toString()

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
        [MAINNET]: "0x6FF180EF62FA57e611E91bdDaDadB6635D6b9Af7",
        [CHAINID_MAINNET]: "0x6FF180EF62FA57e611E91bdDaDadB6635D6b9Af7",
        [TESTNET]: "0x08CB4462958e6462Cc899862393f0b3bB6664efD",
        [CHAINID_TESTNET]: "0x08CB4462958e6462Cc899862393f0b3bB6664efD",
        [DEVNET]: "0x08CB4462958e6462Cc899862393f0b3bB6664efD",
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
        [TESTNET]: "0x7bf539E81e8beE06e3408359aC0867eD9C3bbD52",
        "0x13881": "0x7bf539E81e8beE06e3408359aC0867eD9C3bbD52",
        [DEVNET]: "0x7bf539E81e8beE06e3408359aC0867eD9C3bbD52",
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
        [MAINNET]: "",
        "0x89": "",
        [TESTNET]: "0xB9B749971B1E6DBb72e6D105d873ebA547C472c8",
        "0x13881": "0xB9B749971B1E6DBb72e6D105d873ebA547C472c8",
        [DEVNET]: "0xB9B749971B1E6DBb72e6D105d873ebA547C472c8",
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

export function getContractInfoForNetwork(name: CONTRACT_NAMES, chainNameOrId: string) : CONTRACT_INFO {
    // const abiPath = `../abi/${name}.json`;
    // console.log("File : ", abiPath)
    // if (!fs.existsSync(abiPath)) {
    //     throw new Error("Contract ABI file not exist")
    // }
    // const abi = require(abiPath);

    const abi = CONTRACT_ABI[name];
    if (!abi) {
        throw new Error("Contract ABI not exist")
    }

    const network = mapDidNetworkToBlockchainAnchor(chainNameOrId)
    const address = CONTRACT_ADDRESS[name][network ? network : chainNameOrId];

    if (!address) {
        throw new Error("Contract address not defined");
    }

    return {
        abi: abi,
        address: <string>address
    }
}