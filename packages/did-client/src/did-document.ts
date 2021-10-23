import { Keyring } from '@verida/keyring'
import { DIDDocumentStruct, Endpoints, EndpointType } from './interfaces'
import EncryptionUtils from '@verida/encryption-utils'

export default class DIDDocument {

    private doc: DIDDocumentStruct

    constructor(doc: DIDDocumentStruct | string) {
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

    public async addContext(contextName: string, keyring: Keyring, endpoints: Endpoints) {
        // Build context hash in the correct format
        const contextHash = this.generateContextHash(contextName)

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
        this.addAsymKey(contextHash, keys.asymPublicKeyBase58)
    }

    public removeContext() {
        throw new Error('Not implemented')
    }

    public import(doc: DIDDocumentStruct) {
        this.doc = doc
    }

    public export() {
        return this.doc
    }

    private addService(contextHash: string, endpointType: EndpointType, serviceType: string, endpointUri: string) {
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

    public async signProof(privateKey: Uint8Array | string) {
        if (privateKey == 'string') {
            privateKey = new Uint8Array(Buffer.from(privateKey.substr(2),'hex'))
        }

        const proofData = this.getProofData()
        const signature = EncryptionUtils.signData(proofData, <Uint8Array> privateKey)

        this.doc.proof = {
            type: "EcdsaSecp256k1VerificationKey2019",
            verificationMethod: `${this.doc.id}`,
            proofPurpose: "assertionMethod",
            proofValue: signature
        }
    }

    public verifyProof() {
        if (!this.doc.proof) {
            return false
        }

        const signature = this.doc.proof.proofValue
        const did = this.doc.proof.verificationMethod
        const proofData = this.getProofData()
        
        const address = did.replace('did:vda:','')

        return EncryptionUtils.verifySig(proofData, signature, address)
    }

    private getProofData() {
        const proofData = Object.assign({}, this.doc)
        delete proofData['proof']
        return proofData
    }

    public generateContextHash(contextName: string) {
        const did = this.doc.id.toLowerCase()
        return EncryptionUtils.hash(`${did}/${contextName}`)
    }

    public locateServiceEndpoint(contextName: string, endpointType: EndpointType) {
        const contextHash = this.generateContextHash(contextName)
        const expectedEndpointId = `${this.doc.id}?context=${contextHash}#${endpointType}`

        return this.doc.service!.find(entry => entry.id == expectedEndpointId)
    }

}