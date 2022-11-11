import Axios from 'axios'
import { ConfigurationOptions } from "./interfaces"
import {
    ParsedDID
  } from "did-resolver";
import { DIDDocument } from '@verida/did-document'
import BlockchainApi from "./blockchainApi";

export default class VdaApi {

    private options: ConfigurationOptions
    private blockchain: BlockchainApi

    constructor(options: ConfigurationOptions) {
        this.options = options
        this.blockchain = new BlockchainApi(options)
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
    public async resolve(parsed: ParsedDID): Promise<DIDDocument> {
        const didAddress = parsed.id

        //const endpoints = await this.blockchain.lookup(didAddress)
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
     * Publish the first version of a DIDDocument to a list of endpoints.
     * 
     * @param didDocument 
     * @param endpoints 
     * @return string[] Array of endpoints where the DID Document was successfully published
     */
    public async create(didDocument: DIDDocument, endpoints: string[]) {
        if (!this.options.privateKey) {
            throw new Error(`Unable to create DID: No private key specified in config.`)
        }

        const doc = didDocument.export()
        if (doc.versionId !== 0) {
            throw new Error(`Unable to create DID: Document must be version 0 of the DID Document.`)
        }

        if (endpoints.length === 0) {
            throw new Error(`Unable to create DID: No endpoints provided.`)
        }

        // Sign the DID Document
        didDocument.signProof(this.options.privateKey!)

        // Submit to all the endpoints
        const finalEndpoints: string[] = []
        for (let i in endpoints) {
            const endpoint = endpoints[i]
            try {
                const response = await Axios.post(`${endpoint}`, {
                    document: didDocument.export()
                });

                finalEndpoints.push(endpoint)
            } catch (err: any) {
                console.error('endpoint error!!')
                console.error(err)
            }
        }

        if (finalEndpoints.length <= 0) {
            throw new Error(`Unable to create DID: All endpoints failed to accept the DID Document`)
        }

        // Publish final endpoints on-chain
        //const didAddress = this.didToAddress(didDocument.id)
        //const blockchainResult = await this.blockchain.register(didAddress, finalEndpoints, this.options.privateKey)

        return finalEndpoints
    }

    public async update(didDocument: DIDDocument) {
        if (!this.options.privateKey) {
            throw new Error(`Unable to update DID Document. No private key specified in config.`)
        }
        // @todo
    }

    public async delete(didAddress: string) {
        if (!this.options.privateKey) {
            throw new Error(`Unable to delete DID. No private key specified in config.`)
        }
        // @todo
    }

    public async addEndpoint(didAddress: string, endpoint: string, verifyAllVersions=false) {
        if (!this.options.privateKey) {
            throw new Error(`Unable to create DID. No private key specified in config.`)
        }

        // @todo
    }

    public async removeEndpoint(didAddress: string, endpoint: string) {
        if (!this.options.privateKey) {
            throw new Error(`Unable to create DID. No private key specified in config.`)
        }
        
        // @todo
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

}