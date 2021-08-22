import CeramicClient from '@ceramicnetwork/http-client'
import { SecureStorageContextConfig, SecureStorageContexts } from './interfaces'
import { IDX } from '@ceramicstudio/idx'
const jsSHA = require("jssha")

// Latest on Clay Testnet 9 July 2021
const SECURE_CONTEXTS_SCHEMA_ID = 'kjzl6cwe1jw1477jghfhwzru8a9kvec774jv4tylbyvqrh4z66px37b7zh3jfo3'

/**
 * Class representing the link between a DID and Storage context
 */
export default class StorageLink {

    static schemaId = SECURE_CONTEXTS_SCHEMA_ID

    static setSchemaId(schemaId: string) {
        StorageLink.schemaId = schemaId
    }

    // @todo: cache
    static async getLinks(ceramic: CeramicClient, did: string): Promise<SecureStorageContextConfig[]> {
        const idx = new IDX({ ceramic })
        const secureContexts = <SecureStorageContexts> await idx.get(StorageLink.schemaId, did)

        return secureContexts ? secureContexts.contexts : []
    }

    /**
     * 
     * @param ceramic 
     * @param did 
     * @param contextName 
     * @returns SecureStorageContextConfig | undefined (if not found)
     */
    static async getLink(ceramic: CeramicClient, did: string, context: string, contextIsName: boolean = true): Promise<SecureStorageContextConfig | undefined> {
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
     * @param storageConfig 
     * @param hashContextConfigId If `storageConfig.id` has been specified as the context name it needs to be hashed. Set to true to automatically hash.
     */
    static async setLink(ceramic: CeramicClient, did: string, storageConfig: SecureStorageContextConfig, hashContextConfigId: boolean = true) {
        let contextHash = storageConfig.id
        if (hashContextConfigId) {
            contextHash = StorageLink.hash(`${did}/${contextHash}`)
        }

        const secureContexts = <SecureStorageContextConfig[]> await StorageLink.getLinks(ceramic, did)

        // Remove if already exists
        const contexts = secureContexts.filter((item: SecureStorageContextConfig) => {
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
        const secureContexts = <SecureStorageContextConfig[]> await StorageLink.getLinks(ceramic, did)
        const contexts = secureContexts.filter((item: SecureStorageContextConfig) => {
            return item.id != contextHash
        })

        const idx = new IDX({ ceramic })
        await idx.set(StorageLink.schemaId, {
            contexts: contexts
        })

        return true
    }

    public static hash(input: string): string {
        const hash = new jsSHA('SHA-256', 'TEXT')
        hash.update(input)
        const result = hash.getHash('HEX')
        return result
    }

    static _findHash(contexts: any[], hash: string): SecureStorageContextConfig | undefined {
        for (let i in contexts) {
            if (contexts[i].id == hash) {
                return contexts[i]
            }
        }
    }

}