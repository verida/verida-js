
import { ConnectionConfig, StorageConfig, StorageIndex } from './interfaces'
const jsSHA = require("jssha")
const bs58 = require('bs58')
import { DIDDocument } from 'did-document'
import Keyring from './keyring'

/**
 * An abstract class representing a connection between a DID and a storage configuration
 */
export default abstract class StorageConnection {

    /**
     * Name of this DID method (ie: `ethr`)
     */
    public didMethod: string = ''

    constructor(config?: ConnectionConfig) {}

    /**
     * Get a StorageConfig instance for a given DID and storage name
     * 
     * This basically looks up the DID document to find the databaseUri for the
     * requested DID and storage name.
     * 
     * If not found, you may need to create using `link()`
     * 
     * @param did 
     * @param config 
     */
    public async get(did: string, storageConfig: StorageConfig): Promise<StorageIndex> {
        //const didDoc = await this.getDoc(did)
        const didDoc = await this.link(did, storageConfig)
        if (!didDoc) {
            throw new Error(`Unable to locate DID document for ${did}`)
        }

        const storageNameHashHex = this.buildStorageNameHashHex(storageConfig.name)
        const asymKey = didDoc.publicKey.find((entry: any) => entry.id.includes('asymKey'))
        const signKey = didDoc.publicKey.find((entry: any) => entry.id.includes('signKey'))
        const database = didDoc.service.find((entry: any) => entry.id.includes(`${storageNameHashHex}-database`))
        const application = didDoc.service.find((entry: any) => entry.id.includes(`${storageNameHashHex}-application`))

        const storageIndex = {
            name: storageConfig.name,
            databaseUri: database.serviceEndpoint,
            applicationUri: application.serviceEndpoint,
            asymPublicKey: bs58.decode(asymKey.publicKeyBase58),
            signPublicKey: bs58.decode(signKey.publicKeyBase58)
        }

        return storageIndex
    }

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

        const storageNameHashHex = this.buildStorageNameHashHex(storageConfig.name)
        const keyring = await this.getKeyring(did, storageConfig.name)
        const publicKeys = await keyring.publicKeys()

        const doc = new DIDDocument({
            did: did
        });

        doc.addPublicKey({
            id: `${did}#${storageNameHashHex}-asymKey`,
            type: 'Curve25519EncryptionPublicKey',
            publicKeyBase58: publicKeys.asymPublicKeyBase58
        });

        doc.addPublicKey({
            id: `${did}#${storageNameHashHex}-signKey`,
            type: 'Secp256k1VerificationKey2018',
            publicKeyBase58: publicKeys.signPublicKeyBase58
        });

        doc.addAuthentication({
            publicKey: `${did}#${storageNameHashHex}-signKey`,
            type: 'Secp256k1SignatureAuthentication2018'
        });
 
        doc.addService({
            id: `${did}#${storageNameHashHex}-database`,
            description: storageConfig.name,
            type: "verida.StorageDatabase",
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

    private buildStorageNameHashHex(storageName: string): string {
        const hash = new jsSHA('SHA-256', 'TEXT')
        hash.update(storageName)
        return hash.getHash('HEX')
    }

    public async getKeyring(did: string, storageName: string): Promise<Keyring> {
        const signMessage = `Do you approve access to view and update "${storageName}"?\n\n${did}`
        const signature = await this.sign(signMessage)

        // Deterministically generate keyring from the signature for this storage config
        return new Keyring(signature)
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