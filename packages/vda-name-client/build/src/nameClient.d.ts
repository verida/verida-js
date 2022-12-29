import { NameClientConfig } from './interfaces';
export declare class NameClient {
    private config;
    private vdaWeb3Client;
    private didAddress;
    constructor(config: NameClientConfig);
    register(username: string): Promise<any>;
    /**
     * Get the DID address associated with a `username`.
     *
     * @param username
     * @throws Error Username not found
     * @returns string DID address (ie: 0xabc123...)
     */
    getDidAddress(username: string): Promise<string>;
    /**
     * Get an array of all the usernames associated with a DID
     *
     * @param did
     * @throws Error Unknown blockchain error
     * @returns array Usernames associated with the DID
     */
    getUsernames(did: string): Promise<string[]>;
    private buildContractAddress;
    private buildContractAbi;
    private buildContract;
    private buildContractInfo;
    private signRegister;
    private getNonce;
    private parseDid;
}
