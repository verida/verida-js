import CeramicClient from '@ceramicnetwork/http-client'
import { SecureContextConfig, SecureContexts } from './interfaces'
import { IDX } from '@ceramicstudio/idx'
import * as jsSHA from "jssha"

// Latest on Clay Testnet 9 July 2021
const SECURE_CONTEXTS_SCHEMA_ID = 'kjzl6cwe1jw145l8jya7g6cuyluj17xlyc6t7p6iif12isbi1ppu5cuze4u3njc'

/**
 * Class representing the link between a DID and Storage context
 */
export default class StorageLink {

    static schemaId = SECURE_CONTEXTS_SCHEMA_ID

    static setSchemaId(schemaId: string) {
        StorageLink.schemaId = schemaId
    }

    // @todo: cache
    static async getLinks(ceramic: CeramicClient, did: string): Promise<SecureContextConfig[]> {
        if (!did) {
            return []
        }

        const idx = new IDX({ ceramic })
        const secureContexts = <SecureContexts> await idx.get(StorageLink.schemaId, did)

        return secureContexts ? secureContexts.contexts : []
    }

    /**
     * 
     * @param ceramic 
     * @param did 
     * @param contextName 
     * @returns SecureStorageContextConfig | undefined (if not found)
     */
    static async getLink(ceramic: CeramicClient, did: string, context: string, contextIsName: boolean = true): Promise<SecureContextConfig | undefined> {
        let contextHash = context
        if (contextIsName) {
            contextHash = StorageLink.hash(`${did}/${context}`)
        }

        const secureContexts =  await StorageLink.getLinks(ceramic, did)
        const secureContext = StorageLink._findHash(secureContexts, contextHash)

        return secureContext
    }

    /**
     * 
     * @param ceramic 
     * @param did 
     * @param storageConfig (Must have .id as the contextName)
     */
    static async setLink(ceramic: CeramicClient, did: string, storageConfig: SecureContextConfig) {
        const contextHash = StorageLink.hash(`${did}/${storageConfig.id}`)

        const secureContexts = <SecureContextConfig[]> await StorageLink.getLinks(ceramic, did)

        // Remove if already exists
        const contexts = secureContexts.filter((item: SecureContextConfig) => {
            return item.id != contextHash
        })

        storageConfig.id = contextHash
        contexts.push(storageConfig)

        const idx = new IDX({ ceramic })
        await idx.set(StorageLink.schemaId, {
            contexts: contexts
        })
    }

    static async unlink(ceramic: CeramicClient, did: string, contextName: string) {
        const contextHash = StorageLink.hash(`${did}/${contextName}`)
        const secureContexts = <SecureContextConfig[]> await StorageLink.getLinks(ceramic, did)
        const contexts = secureContexts.filter((item: SecureContextConfig) => {
            return item.id != contextHash
        })

        const idx = new IDX({ ceramic })
        await idx.set(StorageLink.schemaId, {
            contexts: contexts
        })

        return true
    }

    public static hash(input: string): string {
        const hash = new jsSHA.default('SHA-256', 'TEXT')
        hash.update(input)
        const result = hash.getHash('HEX')
        return result
    }

    static _findHash(contexts: any[], hash: string): SecureContextConfig | undefined {
        for (let i in contexts) {
            if (contexts[i].id == hash) {
                return contexts[i]
            }
        }
    }

}