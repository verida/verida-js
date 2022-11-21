import { SecureContextConfig } from './interfaces'
import { DIDClient } from "@verida/did-client"
import { DIDDocument, Interfaces } from "@verida/did-document"
import { DIDDocument as DocInterface, ServiceEndpoint } from 'did-resolver'
import { Endpoints } from '@verida/did-document/dist/interfaces'
import { Keyring } from '@verida/keyring'
import { VdaDidEndpointResponses } from '@verida/vda-did'
const Url = require('url-parse')

/**
 * Class representing the link between a DID and Storage context
 */
export default class StorageLink {

    // @todo: cache
    static async getLinks(didClient: DIDClient, did: string): Promise<SecureContextConfig[]> {
        if (!did) {
            return []
        }

        try {
            const didDocument = await didClient.get(did)
            return StorageLink.buildSecureContexts(didDocument)
        } catch (err) {
            // DID not found
            return []
        }
    }

    /**
     * 
     * @param didClient 
     * @param did 
     * @param contextName 
     * @returns SecureStorageContextConfig | undefined (if not found)
     */
    static async getLink(didClient: DIDClient, did: string, context: string, contextIsName: boolean = true): Promise<SecureContextConfig | undefined> {
        let contextHash = context
        if (contextIsName) {
            contextHash = DIDDocument.generateContextHash(did, context)
        }

        const secureContexts =  await StorageLink.getLinks(didClient, did)
        const secureContext = StorageLink._findHash(secureContexts, contextHash)

        return secureContext
    }

    /**
     * 
     * @param didClient
     * @param storageConfig (Must have .id as the contextName)
     */
    static async setLink(didClient: DIDClient, storageConfig: SecureContextConfig, keyring: Keyring, privateKey: string) {
        const did = didClient.getDid()

        if (!did) {
            throw new Error("DID client is not authenticated")
        }

        let didDocument
        try {
            didDocument = await didClient.get(did)

            // Remove existing context if it exists
            const existing = await StorageLink.getLink(didClient, did, storageConfig.id)
            if (existing) {
                await StorageLink.unlink(didClient, storageConfig.id)
            }
        } catch (err) {
            // DID document not found
            didDocument = new DIDDocument(did, didClient.getPublicKey())
        }

        const endpoints: Endpoints = {
            database: storageConfig.services.databaseServer,
            messaging: storageConfig.services.messageServer
        }

        if (storageConfig.services.storageServer) {
            endpoints.storage = storageConfig.services.storageServer
        }

        if (storageConfig.services.notificationServer) {
            endpoints.notification = storageConfig.services.notificationServer
        }

        await didDocument.addContext(storageConfig.id, keyring, privateKey, endpoints)
        return await didClient.save(didDocument)
    }

    static async setContextService(didClient: DIDClient, contextName: string, endpointType: Interfaces.EndpointType, serverType: string, endpointUris: string[]): Promise<VdaDidEndpointResponses> {
        const did = didClient.getDid()
        if (!did) {
            throw new Error("DID client is not authenticated")
        }

        // Fetch existing DID document
        let didDocument
        try {
            didDocument = await didClient.get(did)
        } catch (err) {
            // document not found
            throw new Error(`DID Document doesn't exist for this context`)
        }

        // Build context hash in the correct format
        const contextHash = DIDDocument.generateContextHash(did, contextName)

        // Add the context service
        await didDocument.addContextService(contextHash, endpointType, serverType, StorageLink.standardizeUrls(endpointUris))

        return didClient.save(didDocument)
    }

    static async unlink(didClient: DIDClient, contextName: string): Promise<VdaDidEndpointResponses | boolean> {
        const did = didClient.getDid()
        if (!did) {
            throw  new Error("DID Client is not authenticated")
        }

        let didDocument
        try {
            didDocument = await didClient.get(did)
        } catch (err) {
            // DID document not found
            return false
        }

        const success = await didDocument!.removeContext(contextName)
        if (!success) {
            return false
        }

        return await didClient.save(didDocument)
    }

    static _findHash(contexts: any[], hash: string): SecureContextConfig | undefined {
        for (let i in contexts) {
            if (contexts[i].id == hash) {
                return contexts[i]
            }
        }
    }

    static buildSecureContexts(didDocument: DIDDocument): SecureContextConfig[] {
        const doc: DocInterface = didDocument.export()
        const did = doc.id

        // strategy: loop through all signing keys as our way of looping through all contexts
        const contexts: SecureContextConfig[] = []
        doc.keyAgreement?.map((value: any) => {
            const assertionParts = Url(value, true)
            if (!assertionParts.query || !assertionParts.query.context) {
                return
            }

            const contextHash = assertionParts.query.context
            
            // Get signing key
            const signKeyVerificationMethod = doc.verificationMethod!.find((entry: any) => entry.id == `${did}?context=${contextHash}&type=sign`)
            if (!signKeyVerificationMethod) {
                return
            }

            const signKey = signKeyVerificationMethod!.publicKeyHex

            // Get asym key
            const asymKeyVerificationMethod = doc.verificationMethod!.find((entry: any) => entry.id == `${did}?context=${contextHash}&type=asym`)
            if (!asymKeyVerificationMethod)  {
                return 
            }

            const asymKey = asymKeyVerificationMethod!.publicKeyHex

            // Get services
            const databaseService = doc.service!.find((entry: any) => entry.id == `${did}?context=${contextHash}&type=database`)
            const messageService = doc.service!.find((entry: any) => entry.id == `${did}?context=${contextHash}&type=messaging`)
            const storageService = doc.service!.find((entry: any) => entry.id == `${did}?context=${contextHash}&type=storage`)
            const notificationService = doc.service!.find((entry: any) => entry.id == `${did}?context=${contextHash}&type=notification`)

            // Valid we have everything
            if (!signKey || !asymKey || !databaseService || !messageService) {
                return
            }

            // Build complete config
            const config: SecureContextConfig = {
                id: contextHash,
                publicKeys: {
                    signKey: {
                        type: "EcdsaSecp256k1VerificationKey2019",
                        publicKeyHex: `0x${signKey!}`
                    },
                    asymKey: {
                        type: "Curve25519EncryptionPublicKey",
                        publicKeyHex: `0x${asymKey!}`
                    }
                },
                services: {
                    databaseServer: {
                        type: databaseService!.type,
                        endpointUri: StorageLink.standardizeUrls(<ServiceEndpoint[]> databaseService!.serviceEndpoint)
                    },
                    messageServer: {
                        type: messageService!.type,
                        endpointUri: StorageLink.standardizeUrls(<ServiceEndpoint[]> messageService!.serviceEndpoint)
                    }
                }
            }

            if (storageService) {
                config.services.storageServer = {
                    type: storageService!.type,
                    endpointUri: StorageLink.standardizeUrls(<ServiceEndpoint[]> storageService!.serviceEndpoint)
                }
            }

            if (notificationService) {
                config.services.notificationServer = {
                    type: notificationService!.type,
                    endpointUri: StorageLink.standardizeUrls(<ServiceEndpoint[]> notificationService!.serviceEndpoint)
                }
            }

            contexts.push(config)
        })

        return contexts
    }

    /**
     * Ensure the URL has a trailing slash
     * 
     * @param endpoint ServiceEndpoint | ServiceEndpoint[]
     * @returns 
     */
    public static standardizeUrls(endpoints: ServiceEndpoint[]): ServiceEndpoint[] {
        const finalEndpoints = []

        for (let i in endpoints) {
            finalEndpoints.push(endpoints[i].replace(/\/$/, '') + '/')
        }

        return finalEndpoints
    }

}