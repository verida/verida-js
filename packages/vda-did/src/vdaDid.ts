import Axios from 'axios'
import { VdaApiConfigurationOptions } from "./interfaces"
import {
    ParsedDID
  } from "did-resolver";
import { DIDDocument } from '@verida/did-document'
import BlockchainApi from "./blockchainApi";

export default class VdaApi {

    private options: VdaApiConfigurationOptions
    private blockchain: BlockchainApi

    constructor(options: VdaApiConfigurationOptions) {
        this.options = options
        this.blockchain = new BlockchainApi(options)
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

}