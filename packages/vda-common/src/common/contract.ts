// import * as fs from 'fs';
export type CONTRACT_NAMES = 
    "DidRegistry"   |
    "NameRegistry"  |
    "SBT"           |

    "DidLinkage"    |
    "VeridaToken"   |
    "RewardContract";


export interface CONTRACT_INFO {
    abi: any,
    address: string
}

export const CONTRACT_ADDRESS : Record<CONTRACT_NAMES, Record<string, string | null>> = {
    "DidRegistry": {
        mainnet: null,
        "0x89": null,
        testnet: "0x08CB4462958e6462Cc899862393f0b3bB6664efD",
        "0x13881": "0x08CB4462958e6462Cc899862393f0b3bB6664efD"
    },
    "NameRegistry": {
        mainnet: null,
        "0x89": null,
        testnet: "0x1dD6AAc1858100091BEbb867C7628DA639F7C16E",
        "0x13881": "0x1dD6AAc1858100091BEbb867C7628DA639F7C16E"
    },
    "SBT" : {
        mainnet: null,
        "0x89": null,
        testnet: "0x7bf539E81e8beE06e3408359aC0867eD9C3bbD52",
        "0x13881": "0x7bf539E81e8beE06e3408359aC0867eD9C3bbD52"
    },

    "DidLinkage" : {},
    "VeridaToken" : {},
    "RewardContract": {}
};

export const CONTRACT_ABI : Record<CONTRACT_NAMES, any> = {
    "DidRegistry": require('./abi/DidRegistry.json'),
    "NameRegistry": require('./abi/NameRegistry.json'),
    "SBT": require('./abi/SBT.json'),

    "DidLinkage": require('./abi/DidLinkage.json'),
    "VeridaToken": require('./abi/VeridaToken.json'),
    "RewardContract": require('./abi/RewardContract.json')
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