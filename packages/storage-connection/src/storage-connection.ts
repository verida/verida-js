
import { ConnectionConfig, StorageConfig } from './interfaces'
import { DIDDocKey, DIDDocRelationship, DIDDocRelationshipType, DIDDocService, DIDDocKeyType, DIDDocument } from "@blobaa/did-document-ts"
import { CryptoLD } from 'crypto-ld'
const cryptoLd = new CryptoLD()
import { Ed25519VerificationKey2018 } from '@digitalbazaar/ed25519-verification-key-2018'
cryptoLd.use(Ed25519VerificationKey2018)
const jsSHA = require("jssha")

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
    public async link(did: string, storageConfig: StorageConfig): Promise<DIDDocument> {
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

        const didAsymKeyObject = didAsymKey.publish()
        const didSignKeyObject = didSignKey.publish()
 
        const storageServerService = new DIDDocService({
            name: `${storageNameHashHex}-server`,
            description: storageConfig.name,
            type: "verida.StorageServer",
            serviceEndpoint: storageConfig.databaseUri,
            asyncPublicKey: didAsymKeyObject.id,
            signPublicKey: didSignKeyObject.id
        })

        const storageApplicationService = new DIDDocService({
            name: `${storageNameHashHex}-application`,
            description: storageConfig.name,
            type: "verida.Application",
            serviceEndpoint: storageConfig.applicationUri
        })

        const authentication = new DIDDocRelationship({
            relationshipType: DIDDocRelationshipType.AUTHENTICATION,
            publicKeysAsRef: [ didSignKey ]
            //publicKeys: [ didSignKeyObject ]
        })

        const now = new Date().toISOString();

        const document = new DIDDocument({
            did: did,
            publicKeys: [ didAsymKeyObject, didSignKeyObject ],
            services: [ storageServerService, storageApplicationService ],
            relationships: [ authentication ],
            created: now,
            updated: now
        })

        return document
    }

    private async buildKey(did: string, signature: string, storageNameHashHex: string, keyType: string): Promise<DIDDocKey> {
        const inputMessage = `${signature}-${keyType}`

        const hash = new jsSHA('SHA-256', 'TEXT')
        hash.update(inputMessage)
        const hashBytes = hash.getHash('UINT8ARRAY')

        const key = await cryptoLd.generate({
            type: DIDDocKeyType.Ed25519,
            controller: did,
            seed: hashBytes
        })
        const keyMaterial = key.export({publicKey: true, privateKey: true})

        const didKey = new DIDDocKey({
            keyType: DIDDocKeyType.Ed25519
        })
        didKey.importKeyMaterial({
            id: `${did}#${storageNameHashHex}-${keyType}`,
            controller: did,
            type: DIDDocKeyType.Ed25519,
            publicKeyBase58: keyMaterial.publicKeyBase58,
            privateKeyBase58: keyMaterial.privateKeyBase58
        })

        return didKey
    }

    public abstract getDoc(did: string): Promise<DIDDocument>

    public abstract saveDoc(didDocument: DIDDocument): Promise<DIDDocument>

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