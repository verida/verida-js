import {
    getVeridaContract,
    VeridaContract
} from "@verida/web3"
import { Web3SelfTransactionConfig, VdaClientConfig } from '@verida/types'
import { ethers, Contract } from "ethers";
import { getContractInfoForNetwork, RPC_URLS, getVeridaSignWithNonce } from "@verida/vda-common";
import { JsonRpcProvider } from '@ethersproject/providers';
import { explodeDID } from '@verida/helpers'

export class VeridaNameClient {

    private config: VdaClientConfig
    private network: string
    private didAddress?: string

    private vdaWeb3Client? : VeridaContract

    private readOnly: boolean
    private contract?: ethers.Contract
    // Key = username, Value = DID
    private usernameCache: Record<string, string> = {}

    public constructor(config: VdaClientConfig) {
        if (!config.callType) {
            config.callType = 'web3'
        }

        this.config = config
        this.readOnly = true
        if (!config.web3Options) {
            config.web3Options = {}
        }

        this.network = config.network

        if (config.callType == 'web3' && !(<Web3SelfTransactionConfig>config.web3Options).rpcUrl) {
            (<Web3SelfTransactionConfig> config.web3Options).rpcUrl = <string> RPC_URLS[this.network]
        }

        const contractInfo = getContractInfoForNetwork("NameRegistry", this.network)

        if (config.did) {
            this.readOnly = false
            const { address } = explodeDID(config.did)
            this.didAddress = address.toLowerCase()
            
            this.vdaWeb3Client = getVeridaContract(
                config.callType, 
                {...contractInfo,
                ...config.web3Options})
        } else {
            let rpcUrl = (<Web3SelfTransactionConfig>config.web3Options).rpcUrl
            if (!rpcUrl) {
                rpcUrl = <string> RPC_URLS[this.network]
            }

            const provider = new JsonRpcProvider(rpcUrl)

            this.contract = new Contract(contractInfo.address, contractInfo.abi.abi, provider)
        }
    }

    /**
     * Get a nonce from DIDRegistry contract
     * @returns nonce of DID
     */
     public async nonceFN() {
        if (!this.vdaWeb3Client) {
            throw new Error(`Config must specify 'did' or 'signKey'`)
        }

        const response = await this.vdaWeb3Client.nonce(this.didAddress);
        if (response.data === undefined) {
            throw new Error('Error in getting nonce');
        }
        return response.data;
    }

    /**
     * Get a signature for {@link BlockchainApi#register} function
     * @param name Name to register
     * @param did DID address
     * @param signKey Verida account key to generate signature
     * @returns Signature
     */
     private async getRegisterSignature (
        name: string,
        did: string,
        signKey: string
    ) {
        let rawMsg = ethers.utils.solidityPack(['string', 'address'], [name, did]);
        return getVeridaSignWithNonce(rawMsg, signKey, await this.nonceFN());
    };

    /**
     * Register a username to the did address
     * @param username Name to register
     */
    public async register(username: string) {
        if (this.readOnly) {
            throw new Error(`Unable to submit to blockchain. No 'signKey' provided in config.`)
        }

        if (!this.config.signKey) {
            throw new Error(`Unable to submit to blockchain. No 'signKey' provided in config.`)
        }

        username = username.toLowerCase()

        const signature = await this.getRegisterSignature(username, this.didAddress!, this.config.signKey!)
        const response = await this.vdaWeb3Client!.register(username, this.didAddress!, signature)

        if (response.success !== true) {
            throw new Error(`Failed to register: ${response.reason}`)
        }

        this.usernameCache[username] = `did:vda:${this.network}:${this.didAddress}`
    }

    /**
     * Unregister a username from the did address
     * @param username Name to be unregistered
     */
    public async unregister(username: string) {
        if (this.readOnly || !this.config.signKey) {
            throw new Error(`Unable to submit to blockchain. In read only mode.`)
        }

        username = username.toLowerCase()

        const signature = await this.getRegisterSignature(username, this.didAddress!, this.config.signKey!)
        const response = await this.vdaWeb3Client!.unregister(username, this.didAddress, signature)

        if (response.success !== true) {
            throw new Error(`Failed to unregister username: ${username} (${response.reason})`)
        }

        delete this.usernameCache[username]
    }

    /**
     * Get the username list of a DID address
     * 
     * @param did DID to lookup the username for
     * @returns username list 
     */
    public async getUsernames(did: string): Promise<string[]> {
        let response
        let didAddress = did.toLowerCase()
        if (didAddress.match('did')) {
            const { address } = explodeDID(did)
            didAddress = address
        }

        // Lookup usernames from cache
        const usernames = Object.entries(this.usernameCache)
            .filter(([, existingDid]) => existingDid === did)
            .map(([username, existingDid]) => username)
        
        if (usernames.length) {
            return usernames
        }

        try {
            if (this.vdaWeb3Client) {
                response = await this.vdaWeb3Client.getUserNameList(didAddress)
                if (response.success !== true) {
                    if (response.errorObj?.errorName === 'InvalidAddress') {
                        return []
                    }

                    throw new Error(response.reason)
                }

                return response.data
            } else {
                response = await this.contract!.callStatic.getUserNameList(didAddress)

                return response
            }
        } catch (err:any ) {
            if (err.errorObj?.errorName === 'InvalidAddress' || err.errorName === 'InvalidAddress' ) {
                return []
            }
            throw new Error(`Failed to get usernames for DID: ${didAddress} (${err.message})`)
        }
    }

    /**
     * Return the DID address for a given username
     * 
     * @param username username registered by {@link register}
     * @returns DID address
     */
    public async getDID(username: string): Promise<string> {
        username = username.toLowerCase()
        if (this.usernameCache[username]) {
            return this.usernameCache[username]
        }

        let response
        try {
            if (this.vdaWeb3Client) {
                response = await this.vdaWeb3Client.findDID(username)

                if (response.success !== true) {
                    throw new Error(`Not found`)
                }

                response = response.data
            } else {
                response = await this.contract!.callStatic.findDID(username)

                if (!response) {
                    throw new Error(`Not found`)
                }
            }

            const did = `did:vda:${this.network}:${response}`
            this.usernameCache[username] = did
            return did
        } catch (err:any ) {
            throw new Error(`Failed to locate the DID for username: ${username} (${err.message})`)
        }
    }

}