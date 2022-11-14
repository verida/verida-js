import Axios from 'axios'
import {
    VdaDidConfigurationOptions,
    VdaDidEndpointResponse,
    VdaDidEndpointResponses
} from "./interfaces"
import {
    ParsedDID
  } from "did-resolver";
import { DIDDocument } from '@verida/did-document'
import BlockchainApi from "./blockchainApi";

export default class VdaDid {

    private options: VdaDidConfigurationOptions
    private blockchain: BlockchainApi
    private lastEndpointErrors?: VdaDidEndpointResponses

    constructor(options: VdaDidConfigurationOptions) {
        this.options = options
        this.blockchain = new BlockchainApi(options)
    }

    /**
     * Publish the first version of a DIDDocument to a list of endpoints.
     * 
     * If an endpoint fails to accept the DID Document, that endpoint will be ignored and won't be included in the
     * list of valid endpoints on chain.
     * 
     * @param didDocument 
     * @param endpoints 
     * @return VdaDidEndpointResponses Map of endpoints where the DID Document was successfully published
     */
    public async create(didDocument: DIDDocument, endpoints: string[]): Promise<VdaDidEndpointResponses> {
        this.lastEndpointErrors = undefined
        if (!this.options.vdaKey) {
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
        didDocument.signProof(this.options.vdaKey!)

        // Submit to all the endpoints
        const finalEndpoints: VdaDidEndpointResponses = {}
        let successCount = 0
        for (let i in endpoints) {
            const endpoint = endpoints[i]
            try {
                const response = await Axios.post(`${endpoint}`, {
                    document: didDocument.export()
                });

                finalEndpoints[endpoint] = {
                    status: 'success'
                }
                
                successCount++
            } catch (err: any) {
                //console.error('endpoint error!!')
                //console.error(err)
                finalEndpoints[endpoint] = {
                    status: 'fail',
                    message: err.response && err.response.data && err.response.data.message ? err.response.data.message : err.message
                }
            }
        }

        if (successCount === 0) {
            this.lastEndpointErrors = finalEndpoints
            throw new Error(`Unable to create DID: All endpoints failed to accept the DID Document`)
        }

        // Publish final endpoints on-chain
        //const didAddress = this.didToAddress(didDocument.id)
        //const blockchainResult = await this.blockchain.register(didAddress, Object.keys(finalEndpoints), this.options.privateKey)

        return finalEndpoints
    }

    /**
     * Publish an updated version of a DIDDocument to a list of endpoints.
     * 
     * If an endpoint fails to accept the DID Document, that will be reflected in the response.
     * 
     * Note: Any failed endpoints will remain on-chain and will need to have the update re-attempted or remove the endpoint from the DID Registry
     * 
     * @param didDocument 
     * @returns VdaDidEndpointResponses Map of endpoints where the DID Document was successfully published
     */
    public async update(didDocument: DIDDocument): Promise<VdaDidEndpointResponses> {
        this.lastEndpointErrors = undefined
        if (!this.options.vdaKey) {
            throw new Error(`Unable to update DID Document. No private key specified in config.`)
        }

        const attributes = didDocument.export()
        if (attributes.created == attributes.updated) {
            throw new Error(`Unable to update DID Document. "updated" timestamp matches "created" timestamp`)
        }

        didDocument.signProof(this.options.vdaKey)

        // Fetch the endpoint list from the blockchain
        const response = await this.blockchain.lookup(didDocument.id)

        // Update all the endpoints
        const finalEndpoints: VdaDidEndpointResponses = {}
        let successCount = 0
        for (let i in response.endpoints) {
            const endpoint = response.endpoints[i]
            try {
                const response = await Axios.put(`${endpoint}`, {
                    document: didDocument.export()
                });

                finalEndpoints[endpoint] = {
                    status: 'success'
                }
                successCount++
            } catch (err: any) {
                //console.error('endpoint error!!')
                //console.error(err.response.data)
                finalEndpoints[endpoint] = {
                    status: 'fail',
                    message: err.response && err.response.data && err.response.data.message ? err.response.data.message : err.message
                }
            }
        }

        if (successCount === 0) {
            this.lastEndpointErrors = finalEndpoints
            throw new Error(`Unable to update DID: All endpoints failed to accept the DID Document`)
        }

        // If the controller doesn't match the DID, the controller may have changed
        if (didDocument.id != didDocument.export().controller) {
            // If the DID controller has changed, update on-chain via `setController()`
            // Requires fetching latest DID Document to confirm the controller has changed
        }

        return finalEndpoints
    }

    public async delete(didAddress: string) {
        if (!this.options.vdaKey) {
            throw new Error(`Unable to delete DID. No private key specified in config.`)
        }

        // 1. Call revoke() on the DID registry
        // 2. Call DELETE on all endpoints
    }

    public async addEndpoint(didAddress: string, endpoint: string, verifyAllVersions=false) {
        if (!this.options.vdaKey) {
            throw new Error(`Unable to create DID. No private key specified in config.`)
        }

        // @todo
    }

    public async removeEndpoint(didAddress: string, endpoint: string) {
        if (!this.options.vdaKey) {
            throw new Error(`Unable to create DID. No private key specified in config.`)
        }
        
        // @todo
    }

    public getLastEndpointErrors() {
        return this.lastEndpointErrors
    }

}