import { Keyring } from '@verida/keyring'
import { DIDDocument, Endpoints, EndpointType, ServiceType } from './interfaces'

export default class VdaDidDocument {

    private doc: DIDDocument

    constructor(doc: DIDDocument | string) {
        if (typeof(doc) == 'string') {
            const did = doc
            this.doc = {
                id: did,
                controller: did
            }
        } else {
            this.doc = doc
        }
    }

    public async addContext(contextHash: string, keyring: Keyring, endpoints: Endpoints) {
        // Add services
        this.addService(contextHash, EndpointType.DATABASE, endpoints.database.type, endpoints.database.endpointUri)
        this.addService(contextHash, EndpointType.MESSAGING, endpoints.messaging.type, endpoints.messaging.endpointUri)

        if (endpoints.storage) {
            this.addService(contextHash, EndpointType.STORAGE, endpoints.storage.type, endpoints.storage.endpointUri)
        }

        if (endpoints.notification) {
            this.addService(contextHash, EndpointType.NOTIFICATION, endpoints.notification.type, endpoints.notification.endpointUri)
        }

        // Add keys
        const keys = await keyring.getKeys()
        this.addSignKey(contextHash, keys.signPublicKeyBase58)
    }

    public removeContext() {
        throw new Error('Not implemented')
    }

    public import(doc: DIDDocument) {
        this.doc = doc
    }

    public export() {
        return this.doc
    }

    private addService(contextHash: string, endpointType: EndpointType, serviceType: ServiceTypes, endpointUri: string) {
        if (!this.doc.service) {
            this.doc.service = []
        }

        this.doc.service.push({
            id: `${this.doc.id}?context=${contextHash}#${endpointType}`,
            type: serviceType,
            serviceEndpoint: endpointUri
        })
    }

    private addSignKey(contextHash: string, publicKeyBase58: string) {
        // Add verification method
        if (!this.doc.verificationMethod) {
            this.doc.verificationMethod = []
        }

        this.doc.verificationMethod.push({
            id: `${this.doc.id}?context=${contextHash}#sign`,
            type: "EcdsaSecp256k1VerificationKey2019",
            controller: this.doc.id,
            publicKeyBase58: publicKeyBase58
        })

        // Add assertion method
        if (!this.doc.assertionMethod) {
            this.doc.assertionMethod = []
        }

        this.doc.assertionMethod.push(`${this.doc.id}?context=${contextHash}#sign`)
    }

    private addAsymKey(contextHash: string, publicKeyBase58: string) {
        // Add verification method
        if (!this.doc.verificationMethod) {
            this.doc.verificationMethod = []
        }

        this.doc.verificationMethod.push({
            id: `${this.doc.id}?context=${contextHash}#asym`,
            type: "Curve25519EncryptionPublicKey",
            controller: this.doc.id,
            publicKeyBase58: publicKeyBase58
        })

        // Add assertion method
        if (!this.doc.keyAgreement) {
            this.doc.keyAgreement = []
        }

        this.doc.keyAgreement.push(`${this.doc.id}?context=${contextHash}#asym`)
    }

    public async addProof(signature: string) {
        this.doc.proof = {
            type: "EcdsaSecp256k1VerificationKey2019",
            verificationMethod: `${this.doc.id}`,
            proofPurpose: "assertionMethod",
            proofValue: signature
        }
    }

}