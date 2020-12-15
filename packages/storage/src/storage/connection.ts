
import { ConnectionConfig, StorageConfig, StorageIndex, Keyrings } from '../interfaces'
const jsSHA = require("jssha")
const bs58 = require('bs58')
import { DIDDocument } from 'did-document'
import Keyring from '../utils/keyring'

/**
 * An abstract class representing a connection between a DID and a storage configuration
 */
export default abstract class Connection {

    /**
     * Name of this DID method (ie: `ethr`)
     */
    public didMethod: string = ''

    private keyringCache: Keyrings = {}

    constructor(config?: ConnectionConfig) {}

    /**
     * Get a StorageConfig instance for a given DID and storage name
     * 
     * This basically looks up the DID document to find the serverUri for the
     * requested DID and storage name.
     * 
     * If not found, you may need to create using `link()`
     * 
     * @param did 
     * @param config 
     */
    public async get(did: string, storageName: string): Promise<StorageIndex | undefined> {
        const didDoc = await this.getDoc(did)
        if (!didDoc) {
            return
        }

        const storageNameHashHex = this.hash(storageName)
        const asymKey = didDoc.publicKey.find((entry: any) => entry.id.includes('asymKey'))
        const signKey = didDoc.publicKey.find((entry: any) => entry.id.includes('signKey'))
        const server = didDoc.service.find((entry: any) => entry.id.includes(`${storageNameHashHex}-server`))

        const storageIndex = {
            name: storageName,
            serverUri: server.serviceEndpoint,
            applicationUri: server.applicationEndpoint,
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
    public async link(did: string, storageConfig: StorageConfig): Promise<StorageIndex> {
        let doc = await this.getDoc(did)

        const storageNameHashHex = this.hash(storageConfig.name)
        const keyring = await this.getKeyring(did, storageConfig.name)
        const publicKeys = await keyring.publicKeys()

        if (!doc) {
            doc = new DIDDocument({
                did: did
            })
        }

        /**
         * Add public asymKey and signKey for this storage name
         */
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
 
        /**
         * Add server and application service endpoints for this storage name
         */
        doc.addService({
            id: `${did}#${storageNameHashHex}-server`,
            description: storageConfig.name,
            type: "verida.StorageServer",
            serviceEndpoint: storageConfig.serverUri,
            asyncPublicKey: `${did}#${storageNameHashHex}-asymKey`,
            signPublicKey: `${did}#${storageNameHashHex}-signKey`,
            applicationEndpoint: storageConfig.applicationUri
        })

        await this.saveDoc(did, doc)

        return {
            name: storageConfig.name,
            serverUri: storageConfig.serverUri,
            applicationUri: storageConfig.applicationUri,
            asymPublicKey: bs58.decode(publicKeys.asymPublicKeyBase58),
            signPublicKey: bs58.decode(publicKeys.signPublicKeyBase58),
        }
    }

    public async unlink(did: string, storageConfig: StorageConfig) {
        throw new Error("Not implemented")
    }

    private hash(input: string): string {
        const hash = new jsSHA('SHA-256', 'TEXT')
        hash.update(input)
        return hash.getHash('HEX')
    }

    /**
     * Get a Keyring
     * 
     * Supports caching keyrings to avoid requesting the same keyring everytime
     * 
     * @param did 
     * @param storageName 
     */
    public async getKeyring(did: string, storageName: string): Promise<Keyring> {
        const keyringHash = this.hash(`${did}/${storageName}`)
        if (this.keyringCache[keyringHash]) {
            return this.keyringCache[keyringHash]
        }

        const signMessage = `Do you approve access to view and update "${storageName}"?\n\n${did}`
        const signature = await this.sign(signMessage)

        // Deterministically generate keyring from the signature for this storage config
        const keyring = new Keyring(signature)

        this.keyringCache[keyringHash] = keyring
        return this.keyringCache[keyringHash]
    }
    

    /**
     * Get a DID document.
     * 
     * Requires implementation by each DID method
     */
    public abstract getDoc(did: string): Promise<any>

    /**
     * Save a DID document
     * 
     * Requires implementation by each DID method
     * @param didDocument 
     */
    public abstract saveDoc(did: string, didDocument: any): Promise<any>

    /**
     * Sign message as the currently authenticated DID
     * 
     * @param data 
     */
    public abstract sign(message: string): Promise<string>

    /**
     * Verify message was signed by a particular DID
     * 
     * Requires implementation by each DID method
     * @param did 
     * @param message 
     * @param signature 
     */
    public abstract verify(did: string, message: string, signature: string): Promise<boolean>

}