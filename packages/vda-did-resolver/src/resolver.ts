import Axios from 'axios'
import { ResolverConfigurationOptions } from "./interfaces";
import { lookup } from './lookup';
import {
    DIDResolutionOptions,
    DIDResolutionResult,
    DIDResolver,
    ParsedDID,
    Resolvable
  } from "did-resolver";
import { DIDDocument } from "@verida/did-document"
import { RPC_URLS } from './config'

/**
 * Create a VdaDidResolver instance and return it
 * @param options Configurations
 * @returns VdaDidResolver instance
 */
export function getResolver(
    options: ResolverConfigurationOptions
  ): Record<string, DIDResolver> {
    return new VdaDidResolver(options).build();
}

export class VdaDidResolver {

    private options: ResolverConfigurationOptions

    constructor(options: ResolverConfigurationOptions) {
        this.options = options
    }

    /** Resolve a DIDDocument from a DID */
    public async resolve(
        did: string,
        parsed: ParsedDID,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _unused: Resolvable,
        options: DIDResolutionOptions
        ): Promise<DIDResolutionResult> {

        const didDoc = await this._resolve(parsed)

        // Return the DIDResolutionResult object
        return {
            didResolutionMetadata: { contentType: 'application/did+ld+json' },
            didDocument: didDoc,
            didDocumentMetadata: {}
        }
    }

    /**
     * Resolve a DID Document
     * 
     * For performance, the latest version is fetched from endpoint. It is possible to fetch all versions
     * and verify them by using the `fullVerification` query param.
     * 
     * Supports query parameters:
     * 
     * `timestamp`: Return DID document that was valid at the specified timestamp
     * `fullVerification`: Verify every copy of the DID document instead of using consensus
     * 
     * @param parsed 
     */
     public async _resolve(parsed: ParsedDID): Promise<DIDDocument> {
        //const rpcUrl = this.options.rpcUrl ? this.options.rpcUrl : RPC_URLS[parsed.method]
        //const endpoints = await lookup(didAddress, parsed.method)
        //throw new Error(`DID Document not found: DID doesn't exit`)

        // For now hardcode single endpoint
        const endpoints = [`http://localhost:5000/did/${parsed.didUrl}`]

        // @todo: support timestamp
        // @todo: support fullVerification 

        const didDocuments = await this.fetchDocuments(endpoints)

        if (didDocuments.length == 0) {
            throw new Error(`DID Document not found: No valid documents on endpoints`)
        }
        
        // @todo: support consensus
        // @todo: support proof verification
        
        
        // For now return the first doc
        return didDocuments[0]
    }

    /**
     * Fetch the latest DIDDocument stored at each endpoint
     * 
     * @param endpoints 
     */
     private async fetchDocuments(endpoints: string[]) {
        const documents: DIDDocument[] = []

        for (let i in endpoints) {
            const endpointUri = endpoints[i]

            try {
                const response = await Axios.get(endpointUri);
                if (response.data.status == 'success') {
                    const doc = new DIDDocument(response.data.data)
                    doc.import(response.data.data)
                    documents.push(doc)
                }
            } catch (err: any) {
                console.error('endpoint error!!')
                console.error(err)
            }
        }

        return documents
    }

    build(): Record<string, DIDResolver> {
        return { vda: this.resolve.bind(this) };
    }

}