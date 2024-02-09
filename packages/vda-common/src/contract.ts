// import * as fs from 'fs';
export type CONTRACT_NAMES = 
    "VeridaDIDRegistry"     |
    "NameRegistry"          |
    "SoulboundNFT"          |

    "VeridaDIDLinkage"      |
    "VeridaToken"           |
    "VDARewardContract"     |
    "StorageNodeRegistry"
    ;


export interface CONTRACT_INFO {
    abi: any,
    address: string
}

export const CONTRACT_ADDRESS : Record<CONTRACT_NAMES, Record<string, string | null>> = {
    "VeridaDIDRegistry": {
        mainnet: "0x6FF180EF62FA57e611E91bdDaDadB6635D6b9Af7",
        "0x89": "0x6FF180EF62FA57e611E91bdDaDadB6635D6b9Af7",
        testnet: "0x08CB4462958e6462Cc899862393f0b3bB6664efD",
        "0x13881": "0x08CB4462958e6462Cc899862393f0b3bB6664efD",
        devnet: "0x08CB4462958e6462Cc899862393f0b3bB6664efD",
    },
    "NameRegistry": {
        mainnet: "0xc9ce048b464034C53207Bf120bF85f317fdb38C8",
        "0x89": "0xc9ce048b464034C53207Bf120bF85f317fdb38C8",
        testnet: "0x1dD6AAc1858100091BEbb867C7628DA639F7C16E",
        "0x13881": "0x1dD6AAc1858100091BEbb867C7628DA639F7C16E",
        devnet: "0x1dD6AAc1858100091BEbb867C7628DA639F7C16E",
    },
    "SoulboundNFT" : {
        mainnet: "0xB500418b5F47758903Ae02bfB3605cBd19062889",
        "0x89": "0xB500418b5F47758903Ae02bfB3605cBd19062889",
        testnet: "0x7bf539E81e8beE06e3408359aC0867eD9C3bbD52",
        "0x13881": "0x7bf539E81e8beE06e3408359aC0867eD9C3bbD52",
        devnet: "0x7bf539E81e8beE06e3408359aC0867eD9C3bbD52",
    },

    "VeridaDIDLinkage" : {
        mainnet: "0x5916F97e31B77884d81bdA875b7686A988E0d517",
        "0x89": "0x5916F97e31B77884d81bdA875b7686A988E0d517",
        testnet: "0xF394a23dc6777cAB3067566F27Ec5bdDD2D0bD2A",
        "0x13881": "0xF394a23dc6777cAB3067566F27Ec5bdDD2D0bD2A",
        devnet: "0xF394a23dc6777cAB3067566F27Ec5bdDD2D0bD2A",
    },
    "VeridaToken" : {
        mainnet: "0x683565196C3EAb450003C964D4bad1fd3068D4cC",
        "0x89": "0x683565196C3EAb450003C964D4bad1fd3068D4cC",
        testnet: "0x745Db51351015d61573db37bC16C49B8506B93c8",
        "0x13881": "0x745Db51351015d61573db37bC16C49B8506B93c8",
        devnet: "0x745Db51351015d61573db37bC16C49B8506B93c8",
    },
    "VDARewardContract": {
        mainnet: "",
        "0x89": "",
        testnet: "0xB9B749971B1E6DBb72e6D105d873ebA547C472c8",
        "0x13881": "0xB9B749971B1E6DBb72e6D105d873ebA547C472c8",
        devnet: "0xB9B749971B1E6DBb72e6D105d873ebA547C472c8",
    },
    "StorageNodeRegistry": {
        mainnet: null,
        "0x89": null,
        testnet: "0x044B2D754923e529A780eFcc085B03ee022e3364",
        "0x13881": "0x044B2D754923e529A780eFcc085B03ee022e3364",
        devnet: "0x044B2D754923e529A780eFcc085B03ee022e3364"
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

    const address = CONTRACT_ADDRESS[name][chainNameOrId];

    if (!address) {
        throw new Error("Contract address not defined");
    }

    return {
        abi: abi,
        address: <string>address
    }
}