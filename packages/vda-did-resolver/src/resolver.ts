import Axios from 'axios'
import { lookup } from './lookup';
import {
    DIDResolutionOptions,
    DIDResolutionResult,
    DIDResolver,
    DIDDocument,
    ParsedDID,
    Resolvable
  } from "did-resolver";
import { DIDDocument as VeridaDIDDocument } from "@verida/did-document"
import { RPC_URLS, interpretIdentifier } from '@verida/vda-common'
import { Web3ResolverConfigurationOptions } from '@verida/types';

/**
 * Create a VdaDidResolver instance and return it
 * @param options Configurations
 * @returns VdaDidResolver instance
 */
export function getResolver(
    options?: Web3ResolverConfigurationOptions
  ): Record<string, DIDResolver> {
    options = !options ? {} : options
    return new VdaDidResolver(options).build()
}

export class VdaDidResolver {

    private options: Web3ResolverConfigurationOptions
    private defaultTimeout: number = 10000

    constructor(options: Web3ResolverConfigurationOptions) {
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

        const didDetails = interpretIdentifier(did)

        try {
            const didDoc = await this._resolve(didDetails)

            // Return the DIDResolutionResult object
            return {
                didResolutionMetadata: { contentType: 'application/did+ld+json' },
                didDocument: didDoc,
                didDocumentMetadata: {}
            }
        
        } catch (err: any) {
            if (err.message == 'DID Document not found: No valid documents on endpoints') {
                return {
                    didDocument: null,
                    didDocumentMetadata: {},
                    didResolutionMetadata: { error: 'notFound' },
                }
            }
        
            throw err
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
     public async _resolve(parsed: any): Promise<DIDDocument> {
        const rpcUrl = this.options.rpcUrl ? this.options.rpcUrl : RPC_URLS[parsed.network]

        let endpoints
        try {
            endpoints = await lookup(parsed.address, parsed.network, rpcUrl!)
        } catch (err: any) {
            if (err.message === 'DID not found') {
                throw new Error(`DID Document not found: No valid documents on endpoints`)
            }

            throw err
        }

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
                const response = await Axios.get(endpointUri, {
                    timeout: this.options.timeout ? this.options.timeout : this.defaultTimeout
                });
                if (response.data.status == 'success') {
                    const doc = new VeridaDIDDocument(response.data.data)
                    doc.import(response.data.data)
                    documents.push(<DIDDocument> doc.export())
                }
            } catch (err: any) {
                //console.error('endpoint error!!')
                //console.error(err)
            }
        }

        return documents
    }

    build(): Record<string, DIDResolver> {
        return { vda: this.resolve.bind(this) };
    }

}