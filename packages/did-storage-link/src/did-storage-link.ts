import CeramicClient from '@ceramicnetwork/http-client'
import { SecureStorageContextConfig, SecureStorageContexts } from './interfaces'
import { IDX } from '@ceramicstudio/idx'
const jsSHA = require("jssha")

const SECURE_CONTEXTS_SCHEMA_ID = 'kjzl6cwe1jw146tceyo9ja27ghttmy8arwet7v5qx1aal2p7ye9lkjmk5c8men6'

/**
 * Class representing the link between a DID and Storage context
 */
export default class DIDStorageLink {

    static schemaId = SECURE_CONTEXTS_SCHEMA_ID

    static async getLinks(ceramic: CeramicClient, did: string): Promise<SecureStorageContextConfig[]> {
        const idx = new IDX({ ceramic })
        const secureContexts = <SecureStorageContexts> await idx.get(SECURE_CONTEXTS_SCHEMA_ID, did)

        return secureContexts ? secureContexts.contexts : []
    }

    /**
     * 
     * @param ceramic 
     * @param did 
     * @param contextName 
     * @returns SecureStorageContextConfig | undefined (if not found)
     */
    static async getLink(ceramic: CeramicClient, did: string, contextName: string): Promise<SecureStorageContextConfig | undefined> {
        const contextHash = DIDStorageLink._hash(`${did}/${contextName}`)
        const secureContexts =  await DIDStorageLink.getLinks(ceramic, did)
        const secureContext = DIDStorageLink._findHash(secureContexts, contextHash)

        return secureContext
    }

    static async setLink(ceramic: CeramicClient, did: string, storageConfig: SecureStorageContextConfig) {
        const contextName = storageConfig.id
        const contextHash = DIDStorageLink._hash(`${did}/${contextName}`)
        const secureContexts = <SecureStorageContextConfig[]> await DIDStorageLink.getLinks(ceramic, did)

        // Remove if already exists
        const contexts = secureContexts.filter((item: SecureStorageContextConfig) => {
            return item.id != contextHash
        })

        storageConfig.id = contextHash
        contexts.push(storageConfig)

        const idx = new IDX({ ceramic })
        await idx.set(SECURE_CONTEXTS_SCHEMA_ID, {
            contexts: contexts
        })
    }

    static async unlink(ceramic: CeramicClient, did: string, contextName: string) {
        const contextHash = DIDStorageLink._hash(`${did}/${contextName}`)
        const secureContexts = <SecureStorageContextConfig[]> await DIDStorageLink.getLinks(ceramic, did)
        const contexts = secureContexts.filter((item: SecureStorageContextConfig) => {
            return item.id != contextHash
        })

        const idx = new IDX({ ceramic })
        await idx.set(SECURE_CONTEXTS_SCHEMA_ID, {
            contexts: contexts
        })

        return true
    }

    static _hash(input: string): string {
        const hash = new jsSHA('SHA-256', 'TEXT')
        hash.update(input)
        const result = hash.getHash('HEX')
        return result
    }

    static _findHash(contexts: any[], hash: string): SecureStorageContextConfig | undefined {
        const result = contexts.reduce((acc, item) => {
            if (item && item.id == hash) {
                return item
            }
        }, null)

        return result
    }

}