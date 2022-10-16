import { Keyring } from '@verida/keyring'
import { DIDDocument as DocInterface} from 'did-resolver'
import { ComparisonResult, Endpoints, EndpointType } from './interfaces'
import EncryptionUtils from '@verida/encryption-utils'
import { ServiceEndpoint, VerificationMethod } from 'did-resolver'
import { interpretIdentifier, verificationMethodTypes } from '@verida/vda-did-resolver'
import { knownNetworks, strip0x } from './helpers'
import { BigNumber } from '@ethersproject/bignumber'
const _ = require('lodash')

export default class DIDDocument {

    private doc: DocInterface
    protected errors: string[] = []

    /**
     * Force lower case DID as we can't guarantee the DID will always be provided with checksum
     * 
     * @param doc - this value can be a DocInterface or DID. 
     */
    constructor(doc: DocInterface | string, publicKeyHex?: string) {
        if (typeof(doc) == 'string') {
            // We are creating a new DID Document
            // Make sure we have a public key
            if (!publicKeyHex || publicKeyHex.length != 132) {
                throw new Error('Unable to create DID Document. Invalid or non-existent public key.')
            }

            const did = doc.toLowerCase()
            this.doc = {
                id: did,
                // controller: did
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
                    type: verificationMethodTypes.EcdsaSecp256k1RecoveryMethod2020,
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
     * @param contextName 
     * @param keyring 
     * @param endpoints 
     */
    public async addContext(contextName: string, keyring: Keyring, endpoints: Endpoints) {
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

        // Build proof for signing key that demonstrates this `did` controls the signing key
        const proofString = `${this.id}-${keys.signPublicAddress}`
        const proof = await keyring.sign(proofString)

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

    public import(doc: DocInterface) {
        doc.id = doc.id.toLowerCase()
        this.doc = doc
    }

    public export(): DocInterface {
        return this.doc
    }

    public addContextService(contextHash: string, endpointType: EndpointType, serviceType: string, endpointUri: string) {
        if (!this.doc.service) {
            this.doc.service = []
        }

        this.doc.service.push({
            id: `${this.doc.id}?context=${contextHash}&type=${endpointType}`,
            type: serviceType,
            serviceEndpoint: endpointUri
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

    /**
     * Compare this document (old) with another doc (new)
     * 
     * ie: This will outline what needs to be changed in the old doc
     * to match the new doc.
     * 
     * Example output:
     * 
     * ```
     * {
     *   {
     *     controller: 'did:vda:0xb194a2809b5b3b8aae350d85233439d32b361694-2',
     *     verificationMethod: { add: [], remove: [ {..}, {..} ] },
     *     assertionMethod: {
     *       add: [],
     *       remove: [
     *         'did:vda:0xb194a2809b5b3b8aae350d85233439d32b361694?context=0xf955c80c778cbe78c9903fa30e157d9d69d76b0a67bbbc0d3c97affeb2cdbb3a'
     *       ]
     *     },
     *     service: { add: [], remove: [ {..}, {..} ] },
     *     keyAgreement: {
     *       add: [],
     *       remove: [
     *         'did:vda:0xb194a2809b5b3b8aae350d85233439d32b361694?context=0xf955c80c778cbe78c9903fa30e157d9d69d76b0a67bbbc0d3c97affeb2cdbb3a'
     *       ]
     *     }
     *   }
     * }
     * ```
     * 
     * @param doc 
     * @returns 
     */
    public compare(doc: DIDDocument): ComparisonResult {
        const docExport = doc.export()
        const thisExport = this.export()

        const result: ComparisonResult = {
            add : {
                // verificationMethod: _.differenceBy(docExport.verificationMethod, thisExport.verificationMethod, 'id'),
                verificationMethod: _.differenceBy(docExport.verificationMethod, thisExport.verificationMethod, (item: { id: any }) => item.id.toLowerCase()),
                assertionMethod: _.differenceBy(docExport.assertionMethod, thisExport.assertionMethod, (item: string) => item.toLowerCase()),
                service: _.differenceBy(docExport.service, thisExport.service, (item: { id: any }) => item.id.toLowerCase()),
                keyAgreement: _.differenceBy(docExport.keyAgreement, thisExport.keyAgreement, (item: string) => item.toLowerCase()),
                authentication: _.differenceBy(docExport.authentication, thisExport.authentication, (item: string) => item.toLowerCase()),

            } as DocInterface,
            remove: {
                // verificationMethod: _.differenceBy(thisExport.verificationMethod, docExport.verificationMethod, 'id'),
                verificationMethod: _.differenceBy(thisExport.verificationMethod, docExport.verificationMethod, (item: { id: any }) => item.id.toLowerCase()),
                assertionMethod: _.differenceBy(thisExport.assertionMethod, docExport.assertionMethod, (item: string) => item.toLowerCase()),
                service: _.differenceBy(thisExport.service, docExport.service, (item: { id: any }) => item.id.toLowerCase()),
                keyAgreement: _.differenceBy(thisExport.keyAgreement, docExport.keyAgreement, (item: string) => item.toLowerCase()),
                authentication: _.differenceBy(thisExport.authentication, docExport.authentication, (item: string) => item.toLowerCase()),
            } as DocInterface
        }

        if (thisExport.controller != docExport.controller) {
            result.controller = docExport.controller
        }
        
        return result
    }

}