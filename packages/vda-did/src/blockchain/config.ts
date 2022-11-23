
export const CONTRACT_ADDRESSES: Record<string, string | null> = {
    mainnet: null,
    "0x89": null,
    testnet: "0x6905AD01eA5Bfb2fa651F9a2DF9659A7Cad8752a",
    "0x13881": "0x6905AD01eA5Bfb2fa651F9a2DF9659A7Cad8752a",
};

export const RPC_URLS: Record<string, string | null> = {
    mainnet: null,
    "0x89": null,
    testnet: "https://rpc-mumbai.maticvigil.com",
    "0x13881": "https://rpc-mumbai.maticvigil.com",
};

export function getContractInfoForNetwork(chainNameOrId: any) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const abi = require('./abi/DidRegistry.json')

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