/* Default RPC URLs to the Polygon blockchains. These default endpoints are public and free but potentially unstable */
export const RPC_URLS: Record<string, string | null> = {
    // Ankr is the official RPC provider of the Polygon foundation
    // https://rpc.ankr.com/polygon is the same as https://polygon-rpc.com as also provided by Ankr
    mainnet: "https://rpc.ankr.com/polygon",
    "0x89": "https://rpc.ankr.com/polygon",
    testnet: "https://rpc-amoy.polygon.technology",
    "0x13882": "https://rpc-amoy.polygon.technology",
    devnet: "https://rpc-amoy.polygon.technology",
    polpos: "https://rpc.ankr.com/polygon",
    polamoy: "https://rpc-amoy.polygon.technology"
};

export function getDefaultRpcUrl(chainNameOrId: any) {
    if (RPC_URLS[chainNameOrId]) {
        return RPC_URLS[chainNameOrId]
    }

    throw new Error(`Unknown chain: ${chainNameOrId}`)
}
