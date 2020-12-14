import { StorageConnection, ConnectionConfig, StorageConfig } from '@verida/storage-connection'
import { DIDDocument } from "@blobaa/did-document-ts"
import { ethers } from 'ethers'

export default class StorageConnectionEthr extends StorageConnection {

    /**
     * Name of this DID method (ie: `ethr`)
     */
    public static didMethod: string = 'ethr'

    private wallet: ethers.Wallet
    private address: string

    constructor(config: ConnectionConfig) {
        super()
        if (!config.privateKey) {
            throw new Error('Private key must be specified')
        }

        this.wallet = new ethers.Wallet(config.privateKey)
        this.address = this.getAddress()
    }

    /**
     * Get a StorageConfig instance from a DID and storage name
     * 
     * @param did 
     * @param storageName 
     */
    public async get(did: string, storageName: string): Promise<StorageConfig> {
        // @todo: fetch from API / DID resolver
        const config = {
            name: 'Test app',
            databaseUri: 'https://dataserver.alpha.verida.io:5000',
            applicationUri: 'https://demos.alpha.verida.io:3001'
        }

        return config
    }

    public async getDoc(did: string): Promise<any> {
        return new DIDDocument({})
    }

    public async saveDoc(didDocument: DIDDocument): Promise<any> {
        return new DIDDocument({})
    }

    /**
     * Sign data as the currently authenticated DID
     * 
     * @param data 
     */
    public async sign(message: string): Promise<string> {
        return await this.wallet.signMessage(message)
    }

    /**
     * Verify message was signed by a particular DID
     * 
     * @param did 
     * @param message 
     * @param signature 
     * @todo
     */
    public async verify(expectedDid: string, message: string, signature: string): Promise<boolean> {
        const did = StorageConnectionEthr.recoverDid(message, signature)
        if (!did) {
            return false
        }

        return expectedDid == did
    }

    public static recoverDid(message: string, signature: string) {
        const address = ethers.utils.verifyMessage(message, signature)
        if (address) {
            return `did:${StorageConnectionEthr.didMethod}:${address}`
        }
    }

    public getPublicKey(privateKey: string): string {
        return this.wallet.publicKey
    }

    public getAddress(): string {
        return ethers.utils.computeAddress(this.wallet.privateKey)
    }

    public getDid(): string {
        return `did:${StorageConnectionEthr.didMethod}:${this.address}`
    }

}