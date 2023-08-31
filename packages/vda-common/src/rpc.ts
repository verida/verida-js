export const RPC_URLS: Record<string, string | null> = {
    devnet: "https://rpc-mumbai.maticvigil.com",
    mainnet: "https://polygon-rpc.com/",
    "0x89": "https://polygon-rpc.com/",
    testnet: "https://rpc-mumbai.maticvigil.com",
    "0x13881": "https://rpc-mumbai.maticvigil.com",
};

export function getDefaultRpcUrl(chainNameOrId: any) {
    if (RPC_URLS[chainNameOrId]) {
        return RPC_URLS[chainNameOrId]
    }

    throw new Error(`Unknown chain: ${chainNameOrId}`)
}