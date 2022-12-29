export declare function sleep(ms: any): Promise<unknown>;
export declare function getBlockchainAPIConfiguration(): {
    callType: "web3" | "gasless";
    rpcUrl: string;
    web3Options: {};
};
