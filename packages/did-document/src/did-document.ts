import { Keyring } from '@verida/keyring'
import { DIDDocument as DocInterface} from 'did-resolver'
import { Endpoints, EndpointType, VerificationMethodTypes } from './interfaces'
import EncryptionUtils from '@verida/encryption-utils'
import { ServiceEndpoint, VerificationMethod } from 'did-resolver'
import { knownNetworks, strip0x } from './helpers'
import { BigNumber } from '@ethersproject/bignumber'
import { computeAddress } from "@ethersproject/transactions";
import { getAddress } from "@ethersproject/address";
import { ethers } from 'ethers'
const _ = require('lodash')

export interface ProofInterface {
    type: string
    verificationMethod: string
    proofPurpose: string
    proofValue: string
}

export interface VeridaDocInterface extends DocInterface {
    versionId: number
    created?: string
    updated?: string
    deactivated?: string
    proof?: ProofInterface
}

function interpretIdentifier(identifier: string): {
    address: string;
    publicKey?: string;
    network?: string;
  } {
    let id = identifier;
    let network = undefined;
    if (id.startsWith("did:vda")) {
      id = id.split("?")[0];
      const components = id.split(":");
      id = components[components.length - 1];
      if (components.length >= 4) {
        network = components.splice(2, components.length - 3).join(":");
      }
    }
    if (id.length > 42) {
      return { address: computeAddress(id), publicKey: id, network };
    } else {
      return { address: getAddress(id), network }; // checksum address
    }
  }

export default class DIDDocument {

    private doc: VeridaDocInterface
    protected errors: string[] = []

    /**
     * Force lower case DID as we can't guarantee the DID will always be provided with checksum
     * 
     * @param doc - this value can be a DocInterface or DID. 
     */
    constructor(doc: VeridaDocInterface | string, publicKeyHex?: string) {
        if (typeof(doc) == 'string') {
            // We are creating a new DID Document
            // Make sure we have a public key
            if (!publicKeyHex || publicKeyHex.length != 132) {
                throw new Error('Unable to create DID Document. Invalid or non-existent public key.')
            }

            const did = doc.toLowerCase()
            this.doc = {
                id: did,
                created: this.buildTimestamp(new Date()),
                updated: this.buildTimestamp(new Date()),
                controller: did,
                versionId: 0
            }


            const { address, publicKey, network } = interpretIdentifier(this.doc.id)

            const hexChainId = network?.startsWith('0x') ? network : knownNetworks[network || 'mainnet']
            const chainId = BigNumber.from(hexChainId).toNumber()
            
            // Add default signing key
            this.doc.assertionMethod = [
                `${this.doc.id}#controller`,
                this.doc.id
            ]
            this.doc.verificationMethod = [
                // From vda-did-resolver/resolver.ts #322
                {
                    id: `${this.doc.id}#controller`,
                    type: VerificationMethodTypes.EcdsaSecp256k1RecoveryMethod2020,
                    controller: this.doc.id,
                    blockchainAccountId: `@eip155:${chainId}:${address}`,
                },
                {
                    id: this.doc.id,
                    type: "EcdsaSecp256k1VerificationKey2019",
                    controller: this.doc.id,
                    publicKeyHex: strip0x(publicKeyHex)
                }
            ]
            this.doc.authentication = [
                `${this.doc.id}#controller`,
                `${this.doc.id}`
            ]
        } else {
            doc.id = doc.id.toLowerCase()
            if (!doc.versionId) {
                doc.versionId = 0
            }
            this.doc = doc
        }
    }

    public get id() {
        return this.doc.id
    }

    public getErrors(): string[] {
        return this.errors
    }

    /**
     * Not used directly, used for testing
     * 
     * @param contextName string
     * @param keyring Keyring
     * @param privateKey Private key of the DID that controls this DID Document 
     * @param endpoints Endpoints
     */
    public async addContext(contextName: string, keyring: Keyring, privateKey: string, endpoints: Endpoints) {
        // Remove this context if it already exists
        this.removeContext(contextName)

        // Build context hash in the correct format
        const contextHash = DIDDocument.generateContextHash(this.doc.id, contextName)

        // Add services
        this.addContextService(contextHash, EndpointType.DATABASE, endpoints.database.type, endpoints.database.endpointUri)
        this.addContextService(contextHash, EndpointType.MESSAGING, endpoints.messaging.type, endpoints.messaging.endpointUri)

        if (endpoints.storage) {
            this.addContextService(contextHash, EndpointType.STORAGE, endpoints.storage.type, endpoints.storage.endpointUri)
        }

        if (endpoints.notification) {
            this.addContextService(contextHash, EndpointType.NOTIFICATION, endpoints.notification.type, endpoints.notification.endpointUri)
        }

        // Get keyring keys so public keys and ownership proof can be saved to the DID document
        const keys = await keyring.getKeys()

        // Generate an address representation of the DID (to save storage)
        const didAddress = this.id.match(/0x[0-9a-z]*/i)![0].toLowerCase()

        // Generate a proof that the DID controls the context public signing key that can be used on chain
        const proofRawMsg = ethers.utils.solidityPack(
            ["address", "address"],
            [didAddress, keys.signPublicAddress]
        )
        const privateKeyArray = new Uint8Array(
            Buffer.from(privateKey.slice(2), "hex")
        )
        const proof = EncryptionUtils.signData(proofRawMsg, privateKeyArray)

        // Add keys to DID document
        this.addContextSignKey(contextHash, keys.signPublicKeyHex, proof)
        this.addContextAsymKey(contextHash, keys.asymPublicKeyHex)
    }

    public removeContext(contextName: string): boolean {
        const contextHash = DIDDocument.generateContextHash(this.doc.id, contextName)

        if (!this.doc.verificationMethod) {
            return false
        }

        const contextSignId = `${this.doc.id}\\?context=${contextHash}&type=sign`
        const contextAsymId = `${this.doc.id}\\?context=${contextHash}&type=asym`

        if (!this.doc.verificationMethod!.find((entry: VerificationMethod) => entry.id.match(contextSignId))) {
            return false
        }

        // Remove signing key and asymmetric key
        this.doc.verificationMethod = this.doc.verificationMethod!.filter((entry: VerificationMethod) => {
            return !entry.id.match(contextSignId) && !entry.id.match(contextAsymId)
        })
        this.doc.assertionMethod = this.doc.assertionMethod!.filter((entry: string | VerificationMethod) => {
            return (
                entry !== `${this.doc.id}?context=${contextHash}&type=sign` && 
                entry !== `${this.doc.id}?context=${contextHash}&type=asym`
            )
        })
        this.doc.keyAgreement = this.doc.keyAgreement!.filter((entry: string | VerificationMethod) => {
            return entry !== `${this.doc.id}?context=${contextHash}&type=asym`
        })
        
        // Remove services
        this.doc.service = this.doc.service!.filter((entry: ServiceEndpoint) => {
            return !entry.id.match(`${this.doc.id}\\?context=${contextHash}`)
        })

        return true
    }

    public setAttributes(attributes: Record<string, any>) {
        for (let attribute in attributes) {
            // @ts-ignore
            this.doc[attribute] = attributes[attribute]
        }
    }

    public import(doc: VeridaDocInterface) {
        doc.id = doc.id.toLowerCase()
        this.doc = doc
    }

    public export(): VeridaDocInterface {
        return this.doc
    }

    public addContextService(contextHash: string, endpointType: EndpointType, serviceType: string, endpointUris: string[]) {
        if (!this.doc.service) {
            this.doc.service = []
        }

        this.doc.service.push({
            id: `${this.doc.id}?context=${contextHash}&type=${endpointType}`,
            type: serviceType,
            // @ts-ignore
            serviceEndpoint: endpointUris
        })
    }

    public addContextSignKey(contextHash: string, publicKeyHex: string, proof: string) {
        // Add verification method
        if (!this.doc.verificationMethod) {
            this.doc.verificationMethod = []
        }

        const id = `${this.doc.id}?context=${contextHash}&type=sign`
        this.doc.verificationMethod.push({
            id: id,
            type: "EcdsaSecp256k1VerificationKey2019",
            controller: this.doc.id,
            // @ts-ignore
            proof,
            publicKeyHex: strip0x(publicKeyHex)
        })

        // Add assertion method
        if (!this.doc.assertionMethod) {
            this.doc.assertionMethod = []
        }

        this.doc.assertionMethod.push(id)
    }

    public addContextAsymKey(contextHash: string, publicKeyHex: string) {
        // Add verification method
        if (!this.doc.verificationMethod) {
            this.doc.verificationMethod = []
        }

        const id = `${this.doc.id}?context=${contextHash}&type=asym`
        this.doc.verificationMethod.push({
            id: id,
            // type: "Curve25519EncryptionPublicKey",
            type: 'X25519KeyAgreementKey2019',
            controller: this.doc.id,
            publicKeyHex: strip0x(publicKeyHex)
        })

        // Add keyAgreement method
        if (!this.doc.keyAgreement) {
            this.doc.keyAgreement = []
        }

        this.doc.keyAgreement.push(id)

        // Add assertion method
        if (!this.doc.assertionMethod) {
            this.doc.assertionMethod = []
        }

        this.doc.assertionMethod.push(id)
    }

    public verifySig(data: any, signature: string): boolean {
        const verificationMethod = this.doc.verificationMethod!.find(entry => entry.id == this.doc.id)
        if (!verificationMethod || !verificationMethod.publicKeyHex) {
            return false
        }
        return EncryptionUtils.verifySig(data, signature, `0x${verificationMethod.publicKeyHex!}`)
    }

    public verifyContextSignature(data: any, contextName: string, signature: string, contextIsHash: boolean = false) {
        let contextHash = contextName
        if (!contextIsHash) {
            contextHash = DIDDocument.generateContextHash(this.doc.id, contextName)
        }

        const publicKeyLookup = `${this.doc.id}?context=${contextHash}&type=sign`
        const verificationMethod = this.doc.verificationMethod!.find(entry => entry.id == publicKeyLookup)

        if (!verificationMethod) {
            return false
        }

        const signPublicKey = `0x${verificationMethod.publicKeyHex!}`
        return EncryptionUtils.verifySig(data, signature, signPublicKey)
    }

    public static generateContextHash(did: string, contextName: string) {
        did = did.toLowerCase()
        return EncryptionUtils.hash(`${did}/${contextName}`)
    }

    public locateServiceEndpoint(contextName: string, endpointType: EndpointType) {
        const contextHash = DIDDocument.generateContextHash(this.doc.id, contextName)
        const expectedEndpointId = `${this.doc.id}?context=${contextHash}&type=${endpointType}`

        return this.doc.service!.find(entry => entry.id == expectedEndpointId)
    }

    public signProof(privateKey: Uint8Array | string) {
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
        const proofData = this.getProofData()

        return this.verifySig(proofData, signature)
    }

    private getProofData() {
        const proofData: any = Object.assign({}, this.doc)
        delete proofData['proof']
        return proofData
    }

    public buildTimestamp(date: Date) {
        return date.toISOString().split('.')[0] + 'Z'
    }

}