import { DIDClient } from "@verida/did-client"
import { DIDDocument as VeridaDIDDocument } from "@verida/did-document"
import { DIDDocument as DocInterface, ServiceEndpoint } from 'did-resolver'
import { Network, IKeyring, SecureContextConfig, SecureContextEndpoints, SecureContextEndpointType, VdaDidEndpointResponses } from "@verida/types"
const Url = require('url-parse')

/**
 * Class representing the link between a DID and Storage context
 */
export default class StorageLink {

    // @todo: cache
    static async getLinks(network: Network, didClient: DIDClient, did: string): Promise<SecureContextConfig[]> {
        if (!did) {
            return []
        }

        try {
            const didDocument = await didClient.get(did)
            const isLegacyDid = (didDocument.export().id != did)
            return StorageLink.buildSecureContexts(didDocument, network, isLegacyDid)
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
    static async getLink(network: Network, didClient: DIDClient, did: string, context: string, contextIsName: boolean = true): Promise<SecureContextConfig | undefined> {
        const secureContexts =  await StorageLink.getLinks(network, didClient, did)

        let contextHash = context
        if (contextIsName) {
            if (secureContexts.length && secureContexts[0].isLegacyDid) {
                did = did.replace('polpos', 'mainnet')
            }

            contextHash = VeridaDIDDocument.generateContextHash(did, context)
        }

        const secureContext = StorageLink._findHash(secureContexts, contextHash)
        return secureContext
    }

    /**
     * 
     * @param didClient
     * @param storageConfig (Must have .id as the contextName)
     */
    static async setLink(network: Network, didClient: DIDClient, storageConfig: SecureContextConfig, keyring: IKeyring, privateKey: string) {
        let did = didClient.getDid()

        if (!did) {
            throw new Error("DID client is not authenticated")
        }

        let didDocument
        try {
            didDocument = await didClient.get(did)

            // Remove existing context if it exists
            const existing = await StorageLink.getLink(network, didClient, did, storageConfig.id)
            if (existing) {
                await StorageLink.unlink(network, didClient, storageConfig.id)
            }
        } catch (err) {
            // DID document not found
            didDocument = new VeridaDIDDocument(did, didClient.getPublicKey())
        }

        const isLegacyDid = (didDocument.export().id != did)
        if (isLegacyDid) {
            did.replace('polpos', 'mainnet')
        }

        const endpoints: SecureContextEndpoints = {
            database: storageConfig.services.databaseServer,
            messaging: storageConfig.services.messageServer
        }

        if (storageConfig.services.storageServer) {
            endpoints.storage = storageConfig.services.storageServer
        }

        if (storageConfig.services.notificationServer) {
            endpoints.notification = storageConfig.services.notificationServer
        }

        await didDocument.addContext(network, storageConfig.id, keyring, privateKey, endpoints)
        return await didClient.save(didDocument)
    }

    static async setContextService(network: Network, didClient: DIDClient, contextName: string, endpointType: SecureContextEndpointType, serverType: string, endpointUris: string[]): Promise<VdaDidEndpointResponses> {
        const did = didClient.getDid()
        if (!did) {
            throw new Error("DID client is not authenticated")
        }

        // Fetch existing DID document
        let didDocument
        try {
            didDocument = await didClient.get(did)
        } catch (err: any) {
            // document not found
            throw new Error(`DID Document doesn't exist for this context`)
        }

        // Build context hash in the correct format
        const contextHash = VeridaDIDDocument.generateContextHash(did, contextName)

        // Add the context service
        await didDocument.addContextService(network, contextHash, endpointType, serverType, StorageLink.standardizeUrls(endpointUris))

        return didClient.save(didDocument)
    }

    static async unlink(network: Network, didClient: DIDClient, contextName: string): Promise<VdaDidEndpointResponses | boolean> {
        const did = didClient.getDid()
        if (!did) {
            throw  new Error("DID Client is not authenticated")
        }

        let didDocument
        try {
            didDocument = await didClient.get(did)
        } catch (err: any) {
            // DID document not found
            return false
        }

        const success = await didDocument!.removeContext(contextName, network)
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

    static buildSecureContexts(didDocument: VeridaDIDDocument, network?: Network, isLegacyDid?: boolean): SecureContextConfig[] {
        const doc: DocInterface = didDocument.export()
        const did = doc.id
        const networkString = network ? `network=${network.toString()}&` : ''

        let returnLegacyContexts = false

        // strategy: loop through all signing keys as our way of looping through all contexts
        const contexts: SecureContextConfig[] = []
        doc.keyAgreement?.map((value: any) => {
            const assertionParts = Url(value, true)
            if (!assertionParts.query || !assertionParts.query.context) {
                return
            }

            const contextHash = assertionParts.query.context
            
            // Get signing key
            const signKeyVerificationMethod = doc.verificationMethod!.find((entry: any) => entry.id == `${did}?${networkString}context=${contextHash}&type=sign`)
            if (!signKeyVerificationMethod) {
                return
            }

            const signKey = signKeyVerificationMethod!.publicKeyHex

            // Get asym key
            const asymKeyVerificationMethod = doc.verificationMethod!.find((entry: any) => entry.id == `${did}?${networkString}context=${contextHash}&type=asym`)
            if (!asymKeyVerificationMethod)  {
                return 
            }

            const asymKey = asymKeyVerificationMethod!.publicKeyHex

            // Get services
            const databaseService = doc.service!.find((entry: any) => entry.id == `${did}?${networkString}context=${contextHash}&type=database`)
            const messageService = doc.service!.find((entry: any) => entry.id == `${did}?${networkString}context=${contextHash}&type=messaging`)
            const storageService = doc.service!.find((entry: any) => entry.id == `${did}?${networkString}context=${contextHash}&type=storage`)
            const notificationService = doc.service!.find((entry: any) => entry.id == `${did}?${networkString}context=${contextHash}&type=notification`)

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
                },
                isLegacyDid: isLegacyDid ? true : false
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

        if (networkString && network == Network.MYRTLE) {
            // Old Myrtle DID's don't specify the network, so if we have Myrtle
            // network, attempt to find context config that has no network specified
            const legacyContexts = StorageLink.buildSecureContexts(didDocument, undefined, isLegacyDid)
            contexts.push(...legacyContexts)
        }

        return contexts
    }

    /**
     * Ensure the URL has a trailing slash and appropriate port set
     * 
     * @param endpoint ServiceEndpoint | ServiceEndpoint[]
     * @returns 
     */
    public static standardizeUrls(endpoints: ServiceEndpoint[]): ServiceEndpoint[] {
        const finalEndpoints = []

        for (let i in endpoints) {
            const url = new Url(endpoints[i])
            const port = url.port ? url.port : (url.protocol == 'https:' ? 443 : 80)
            finalEndpoints.push(`${url.protocol}//${url.hostname}:${port}/`)
        }

        return finalEndpoints
    }

}