
export const CONTRACT_ADDRESSES: Record<string, string | null> = {
    mainnet: null,
    "0x89": null,
    testnet: "0x666F81e59082ccD7C8737f84e1C232a982043140",
    "0x13881": "0x666F81e59082ccD7C8737f84e1C232a982043140",
};

export const RPC_URLS: Record<string, string | null> = {
    mainnet: null,
    "0x89": null,
    testnet: "https://rpc-mumbai.maticvigil.com",
    "0x13881": "https://rpc-mumbai.maticvigil.com",
    // testnet: "https://polygon-mumbai.g.alchemy.com/v2/PAsQgyEm6lFytuZqbJQfZHWrP-0MZmsK",
    // "0x13881": "https://polygon-mumbai.g.alchemy.com/v2/PAsQgyEm6lFytuZqbJQfZHWrP-0MZmsK",
};

export function getContractInfoForNetwork(chainNameOrId: any) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const abi = require('./abi/NameRegistry.json')

    const address = CONTRACT_ADDRESSES[chainNameOrId];

    if (!address) {
        throw new Error("Contract address not defined");
    }
    return {
        abi: abi,
        address: <string>address,
    };
}

export function getDefaultRpcUrl(chainNameOrId: any) {
    if (RPC_URLS[chainNameOrId]) {
        return RPC_URLS[chainNameOrId]
    }

    throw new Error(`Unknown chain: ${chainNameOrId}`)
}