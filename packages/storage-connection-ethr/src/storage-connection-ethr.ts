import { StorageConnection, ConnectionConfig, StorageConfig } from '@verida/storage-connection'
import { ethers } from 'ethers'

export default class StorageConnectionEthr implements StorageConnection {

    /**
     * Name of this DID method (ie: `ethr`)
     */
    public static didMethod: string = 'ethr'

    private wallet: ethers.Wallet

    constructor(config: ConnectionConfig) {
        if (!config.privateKey) {
            throw new Error('Private key must be specified')
        }

        this.wallet = new ethers.Wallet(config.privateKey)
    }

    /**
     * Get a StorageConfig instance from a DID and storage name
     * 
     * @param did 
     * @param storageName 
     */
    public async get(did: string, storageName: string): Promise<StorageConfig> {
        const config = {
            publicKeys: [
                {
                    "id": `${did}#asym`,
                    "type": "Curve25519EncryptionPublicKey",
                    "controller": "did:vid:0x1cbec5eed940523bdcd1121d51ba3c799cf1b8b74fa77e3e10e4fe0d24b5e772",
                    "publicKeyHex": "0x3a9db7d3dbc4314e60dcbe2b4e010c084d478ad24fb3c8ccbc5b01f5cf81f46b"
                },
                {
                    "id": `${did}#sign`,
                    "type": "Secp256k1VerificationKey2018",
                    "controller": "did:vid:0x1cbec5eed940523bdcd1121d51ba3c799cf1b8b74fa77e3e10e4fe0d24b5e772",
                    "publicKeyHex": "0x1ed6be53d8ad36d5869f307ba9c5b762a86f4e9254a41e73e071356343c87580"
                }
            ],
            authKeys: [
                {
                    "publicKey": `${did}#sign`,
                    "type": "Secp256k1SignatureAuthentication2018"
                }
            ],
            databaseUri: 'https://dataserver.alpha.verida.io:5000',
            applicationUri: 'https://demos.alpha.verida.io:3001'
        }

        return config
    }

    /**
     * Link a DID and storage name to a given storage configuration
     * 
     * @param did 
     * @param storageName 
     * @param storageConfig 
     */
    public async link(did: string, storageName: string, storageConfig: StorageConfig): Promise<boolean> {
        return true
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
    public verify(expectedDid: string, message: string, signature: string): boolean {
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

}