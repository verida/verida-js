import { StorageConnection, ConnectionConfig, StorageConfig } from '@verida/storage-connection'

export default class StorageConnectionEthr implements StorageConnection {

    /**
     * Name of this DID method (ie: `ethr`)
     */
    public didMethod = 'ethr'

    constructor(config?: ConnectionConfig) {
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
    public async sign(data: object): Promise<string> {
        return 'hi'
    }

    /**
     * Authenticate a DID using this current DID method
     * 
     * @param config 
     */
    public async authenticate(config: any): Promise<boolean> {
        return true
    }

}