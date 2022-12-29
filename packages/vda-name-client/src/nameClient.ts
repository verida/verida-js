import { CONTRACT_ADDRESSES } from "./config";
import { getVeridaContract, VeridaContract } from "@verida/web3"
import { JsonRpcProvider } from '@ethersproject/providers';
import { ethers, ContractFactory, Contract } from 'ethers';
import EncryptionUtils from '@verida/encryption-utils'
import { NameClientConfig, NameClientError } from './interfaces'

export class NameClient {

    private config: NameClientConfig
    private vdaWeb3Client: VeridaContract

    private did?: string
    private didAddress?: string
    private privateKey?: string

    public constructor(config: NameClientConfig) {
        this.config = config

        const contractInfo = this.buildContractInfo()

        // @ts-ignore
        if (config.callType == 'web3' && !config.web3Options.rpcUrl) {
            throw new Error('Web3 transactions must specify `rpcUrl` in the configuration options')
        }

        this.vdaWeb3Client = getVeridaContract(
            config.callType, 
            {...contractInfo,
            ...config.web3Options});
    }

    public authenticate(did: string, privateKey: string) {
        this.did = did
        this.privateKey = privateKey
        const didParts = this.parseDid(did)
        this.didAddress = didParts.address
    }

    public async register(username: string): Promise<void> {
        if (!this.privateKey) {
            throw new Error('Not authenticated')
        }

        const signature = await this.signRegister(username)

        // Register a name against a DID
        let result
        try {
            result = await this.vdaWeb3Client.register(username, this.didAddress, signature);
        } catch (err: any) {
            throw new NameClientError(`Unable to register name for DID (${this.did})`, err.message)
        }

        if (!result.success) {
            const reason = this.getBlockchainErrorReason(result.error)
            throw new NameClientError(`Unable to register name for DID (${this.did})`, reason)
        }

        return result
    }

    public async unregister(username: string): Promise<void> {
        if (!this.privateKey) {
            throw new Error('Not authenticated')
        }

        const signature = await this.signRegister(username)

        // Register a name against a DID
        let result
        try {
            result = await this.vdaWeb3Client.unregister(username, this.didAddress, signature);
        } catch (err: any) {
            throw new NameClientError(`Unable to unregister name for DID (${this.did})`, err.message)
        }

        if (!result.success) {
            const reason = this.getBlockchainErrorReason(result.error)
            throw new NameClientError(`Unable to unregister name for DID (${this.did})`, reason)
        }

        return result
    }

    /**
     * Get the DID address associated with a `username`.
     * 
     * @param username 
     * @throws Error Username not found
     * @returns string DID address (ie: 0xabc123...)
     */
    public async getDidAddress(username: string): Promise<string> {
        let result
        try {
            result = await this.vdaWeb3Client.findDID(username);
        } catch (err: any) {
            throw new Error(`Unable to find DID for name (${username}): ${err.message}`)
        }
            
        if (!result.success) {
            const reason = this.getBlockchainErrorReason(result.error)
            throw new NameClientError(`Unable to find DID for name (${username})`, reason)
        }

        return result
    }

    /**
     * Get an array of all the usernames associated with a DID
     * 
     * @param did
     * @throws Error Unknown blockchain error
     * @returns array Usernames associated with the DID
     */
    public async getUsernames(did: string): Promise<string[]> {
        const didParts = this.parseDid(did)

        let result
        try {
            result = await this.vdaWeb3Client.getUserNameList(didParts.address);
        } catch (err: any) {
            throw new Error(`Unable to find usernames for DID (${did}): ${err.message}`)
        }
            
        if (!result.success) {
            const reason = this.getBlockchainErrorReason(result.error)
            if (reason == 'No registered DID') {
                return []
            }

            throw new NameClientError(`Unable to find usernames for DID (${did})`, reason)
        }

        return result
    }

    private buildContractAddress(): string {
        return <string> CONTRACT_ADDRESSES[this.config.network];
    }

    private buildContractAbi(): object {
        return require(`./abi/NameRegistry.json`);
    }

    private buildContractInfo(): {
        address: string,
        abi: object
    } {
        return {
            address: this.buildContractAddress(),
            abi: this.buildContractAbi()
        }
    }

    private async signRegister(name: string) {
        if (!this.privateKey) {
            throw new Error('Not authenticated')
        }

        const rawMsg = ethers.utils.solidityPack(
            ["string", "address"],
            [name, this.didAddress]
        );

        console.log([name, this.didAddress])

        const nonce = await this.getNonce()

        console.log([rawMsg, nonce])
        const wrappedMsg = ethers.utils.solidityPack(["bytes", "uint256"], [rawMsg, nonce]);

        console.log(this.privateKey.slice(2))
        const privateKeyArray = new Uint8Array(
            Buffer.from(this.privateKey.slice(2), "hex")
        );

        console.log([wrappedMsg, privateKeyArray])
        return EncryptionUtils.signData(wrappedMsg, privateKeyArray);
    }

    private async getNonce(): Promise<Number> {
        const response = await this.vdaWeb3Client.nonce(this.didAddress);
        if (response.data === undefined) {
            throw new Error('Error in getting nonce');
        }

        return response.data
    }

    private parseDid(did: string): {
        address: string;
        publicKey?: string;
        network?: string;
    } {
        let id = did;
        let network = undefined;
        if (id.startsWith("did:vda")) {
            id = id.split("?")[0];
            const components = id.split(":");
            id = components[components.length - 1];
            if (components.length >= 4) {
            network = components.splice(2, components.length - 3).join(":");
            }
        }
        
        if (id.length > 42) {
            return { address: ethers.utils.computeAddress(id).toLowerCase(), publicKey: id, network };
        } else {
            return { address: ethers.utils.getAddress(id).toLowerCase(), network }; // checksum address
        }
    }

    private getBlockchainErrorReason(blockchainError: Error) {
        // @ts-ignore
        let reason = blockchainError.error.reason
        return reason.replace('execution reverted: ', '')
    }

}