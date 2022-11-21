
export const CONTRACT_ADDRESSES: Record<string, string | null> = {
    mainnet: null,
    "0x89": null,
    testnet: "0x322F0273D7f6eCd9EeBc6C800a6777d1b3EEB697",
    "0x13881": "0x322F0273D7f6eCd9EeBc6C800a6777d1b3EEB697",
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