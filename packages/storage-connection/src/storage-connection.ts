
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

        const didAsymKey = await this.buildKey(did, signature, 'asym-key')
        const didSignKey = await this.buildKey(did, signature, 'sign-key')

        const didAsymKeyObject = didAsymKey.publish()
        const didSignKeyObject = didSignKey.publish()

        const hash = new jsSHA('SHA-256', 'TEXT')
        hash.update(storageConfig.name)
        const storageNameHashHex = hash.getHash('HEX')

        const storageServerService = new DIDDocService({
            name: storageNameHashHex,
            description: storageConfig.name,
            type: "verida.StorageServer",
            serviceEndpoint: storageConfig.databaseUri,
            asyncPublicKey: didAsymKeyObject.id,
            signPublicKey: didSignKeyObject.id
        });

        const now = new Date().toISOString();
        const document = new DIDDocument({
            did: did,
            publicKeys: [ didAsymKeyObject, didSignKeyObject ],
            services: [ storageServerService ],
            
            //relationships: [ authentication, assertion, invocation ],
            //services: [ vcService, myService ],
            created: now,
            updated: now
        })

        return document

        /*// @todo: update existing did doc

        doc.addPublicKey({
            id: `${vid}#asymKey`,
            type: 'Curve25519EncryptionPublicKey',
            publicKeyHex: publicKeys.asym
        });

        doc.addPublicKey({
            id: `${vid}#sign`,
            type: 'Secp256k1VerificationKey2018',
            publicKeyHex: publicKeys.sign
        });

        doc.addAuthentication({
            publicKey: `${vid}#sign`,
            type: 'Secp256k1SignatureAuthentication2018'
        });

        doc.addService({
            id: `${vid}#application`,
            type: 'verida.App',
            serviceEndpoint: 'https://wallet.verida.io',
            description: 'Verida Wallet'
        });

        doc.addService({
            id: `${vid}#Verida-Demo-Application`,
            type: 'verida.Application',
            serviceEndpoint: 'https://demoapp.verida.io',
            description: 'Verida Demo Application'
        });

        return this.saveDoc(doc)*/

        /*const config = {
            publicKeys: [
                {
                    "id": `${this.did}#asym`,
                    "type": "Curve25519EncryptionPublicKey",
                    "controller": `${this.did}`,
                    "publicKeyHex": "0x3a9db7d3dbc4314e60dcbe2b4e010c084d478ad24fb3c8ccbc5b01f5cf81f46b"
                },
                {
                    "id": `${this.did}#sign`,
                    "type": "Secp256k1VerificationKey2018",
                    "controller": `${this.did}`,
                    "publicKeyHex": "0x1ed6be53d8ad36d5869f307ba9c5b762a86f4e9254a41e73e071356343c87580"
                }
            ],
            authKeys: [
                {
                    "publicKey": `${this.did}#sign`,
                    "type": "Secp256k1SignatureAuthentication2018"
                }
            ],
            databaseUri: 'https://dataserver.alpha.verida.io:5000',
            applicationUri: 'https://demos.alpha.verida.io:3001'
        }

        return true
        */
    }

    private async buildKey(did: string, signature: string, entropy: string): Promise<DIDDocKey> {
        const inputMessage = `${signature}-${entropy}`

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
            did: did,
            keyType: DIDDocKeyType.Ed25519,
            controller: did
        })
        didKey.importKeyMaterial({
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