import { StorageConnection, ConnectionConfig, StorageConfig } from '@verida/storage'
import { DIDDocument } from "@blobaa/did-document-ts"
import { ethers } from 'ethers'

export default class StorageConnectionEthr extends StorageConnection {

    /**
     * Name of this DID method (ie: `ethr`)
     */
    public didMethod: string = 'ethr'

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
        const did = await this.recoverDid(message, signature)
        if (!did) {
            return false
        }

        return expectedDid == did
    }

    public async recoverDid(message: string, signature: string) {
        const address = ethers.utils.verifyMessage(message, signature)
        if (address) {
            return `did:${this.didMethod}:${address}`
        }
    }

    public getPublicKey(privateKey: string): string {
        return this.wallet.publicKey
    }

    public getAddress(): string {
        return ethers.utils.computeAddress(this.wallet.privateKey)
    }

    public getDid(): string {
        return `did:${this.didMethod}:${this.address}`
    }

}