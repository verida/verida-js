/* Default RPC URLs to the Polygon blockchains. These default endpoints are public and free but potentially unstable */
export const RPC_URLS: Record<string, string | null> = {
    // https://polygon-rpc.com is the official RPC provider of the Polygon foundation
    mainnet: "https://polygon-rpc.com",
    "0x89": "https://polygon-rpc.com",
    testnet: "https://rpc-amoy.polygon.technology",
    "0x13882": "https://rpc-amoy.polygon.technology",
    devnet: "https://rpc-amoy.polygon.technology",
    polpos: "https://polygon-rpc.com",
    polamoy: "https://rpc-amoy.polygon.technology"
};

export function getDefaultRpcUrl(chainNameOrId: any) {
    if (RPC_URLS[chainNameOrId]) {
        return RPC_URLS[chainNameOrId]
    }

    throw new Error(`Unknown chain: ${chainNameOrId}`)
}
