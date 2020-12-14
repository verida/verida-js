
import { ConnectionConfig, StorageConfig } from './interfaces'
const jsSHA = require("jssha")
import { box, sign } from "tweetnacl"
const bs58 = require('bs58')
import { DIDDocument } from 'did-document'

/**
 * An abstract class representing a connection between a DID and a storage configuration
 */
export default abstract class StorageConnection {

    /**
     * Name of this DID method (ie: `ethr`)
     */
    public static didMethod: string

    constructor(config?: ConnectionConfig) {}

    /**
     * Get a StorageConfig instance from a DID and storage name
     * 
     * @param did 
     * @param storageName 
     */
    public abstract get(did: string, storageName: string): Promise<StorageConfig>

    /**
     * Link a DID and storage name to a given storage configuration
     * 
     * @param did 
     * @param storageName 
     * @param storageConfig 
     */
    public async link(did: string, storageConfig: StorageConfig): Promise<any> {
        // @todo: get existing did doc (create if it doesn't exist)
        //const existingDoc = await this.getDoc(did)

        // Deterministically generate asym keypair for the given storageName
        const signMessage = `Do you approve access to view and update "${storageConfig.name}"?\n\n${did}`
        const signature = await this.sign(signMessage)

        const hash = new jsSHA('SHA-256', 'TEXT')
        hash.update(storageConfig.name)
        const storageNameHashHex = hash.getHash('HEX')

        const didAsymKey = await this.buildKey(did, signature, storageNameHashHex, 'asym')
        const didSignKey = await this.buildKey(did, signature, storageNameHashHex, 'sign')

        const doc = new DIDDocument({
            did: did
        });

        doc.addPublicKey({
            id: `${did}#${storageNameHashHex}-asymKey`,
            type: 'Curve25519EncryptionPublicKey',
            publicKeyBase58: bs58.encode(didAsymKey.publicKey)
        });

        doc.addPublicKey({
            id: `${did}#${storageNameHashHex}-signKey`,
            type: 'Secp256k1VerificationKey2018',
            publicKeyBase58: bs58.encode(didSignKey.publicKey)
        });

        doc.addAuthentication({
            publicKey: `${did}#${storageNameHashHex}-signKey`,
            type: 'Secp256k1SignatureAuthentication2018'
        });
 
        doc.addService({
            id: `${did}#${storageNameHashHex}-server`,
            description: storageConfig.name,
            type: "verida.StorageServer",
            serviceEndpoint: storageConfig.databaseUri,
            asyncPublicKey: `${did}#${storageNameHashHex}-asymKey`,
            signPublicKey: `${did}#${storageNameHashHex}-signKey`
        })

        doc.addService({
            id: `${did}#${storageNameHashHex}-application`,
            description: storageConfig.name,
            type: "verida.Application",
            serviceEndpoint: storageConfig.applicationUri
        })

        return doc
    }

    private async buildKey(did: string, signature: string, storageNameHashHex: string, keyType: string): Promise<nacl.BoxKeyPair> {
        const inputMessage = `${signature}-${keyType}`

        const hash = new jsSHA('SHA-256', 'TEXT')
        hash.update(inputMessage)
        const hashBytes = hash.getHash('UINT8ARRAY')

        let keyPair
        if (keyType == 'sign') {
            keyPair = sign.keyPair.fromSeed(hashBytes)
        } else {
            keyPair = box.keyPair.fromSecretKey(hashBytes)
        }

        return keyPair
    }

    public abstract getDoc(did: string): Promise<any>

    public abstract saveDoc(didDocument: object): Promise<any>

    /**
     * Sign message as the currently authenticated DID
     * 
     * @param data 
     */
    public abstract sign(message: string): Promise<string>

    /**
     * Verify message was signed by a particular DID
     * 
     * @param did 
     * @param message 
     * @param signature 
     */
    public abstract verify(did: string, message: string, signature: string): Promise<boolean>

}