import Axios from 'axios'
import { ethers } from 'ethers'
import { DIDDocument } from '@verida/did-document'
import EncryptionUtils from '@verida/encryption-utils'
import BlockchainApi from "./blockchain/blockchainApi";
import { interpretIdentifier } from '@verida/vda-common'
import { VdaDidConfigurationOptions, VdaDidEndpointResponses } from '@verida/types'

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
    public async create(didDocument: DIDDocument, endpoints: string[], retries: number = 3): Promise<VdaDidEndpointResponses> {
        this.lastEndpointErrors = undefined
        if (!this.options.signKey) {
            throw new Error(`Unable to create DID: No private key specified in config.`)
        }

        const doc = didDocument.export()
        if (doc.versionId !== 0) {
            throw new Error(`Unable to create DID: Document must be version 0 of the DID Document.`)
        }

        if (endpoints.length === 0) {
            throw new Error(`Unable to create DID: No endpoints provided.`)
        }

        if (!didDocument.id.match(`did:vda:${this.options.blockchain.toString()}`)) {
            throw new Error(`Unable to create DID: Blockchain in address doesn't match config`)
        }

        // Sign the DID Document
        didDocument.signProof(this.options.signKey!)

        // Submit to all the endpoints
        const promises = []
        for (let i in endpoints) {
            promises.push(Axios.post(`${endpoints[i]}`, {
                document: didDocument.export()
            }))
        }

        // Verify all endpoints successfully created the DID Document
        const finalEndpoints: any = {}
        try {
            // If any of the promises fail, the exception will be thrown
            const results = await Promise.all(promises)

            for (let i in endpoints) {
                finalEndpoints[endpoints[i]] = {
                    status: 'success'
                }
            }
        } catch (err: any) {
            const message = err.response ? (err.response.data.message ? err.response.data.message : err.response.data) : err.message
            if (message.match('DID Document already exists')) {
                try {
                    const blockchainEntry = await this.blockchain.lookup(didDocument.id)
                } catch (err: any) {
                    // DID document exists on the nodes, but not on the blockchain -- this shouldn't happen
                    // but we will cleanup by removing from the nodes and trying again
                    await this.deleteFromEndpoints(endpoints)

                    // try again
                    if (retries > 0) {
                        return await this.create(didDocument, endpoints, retries--)
                    }
                }

                // DID already exists, so use update instead
                throw new Error('Unable to create DID: Already exists')
            }

            throw new Error(`Unable to create DID: Endpoints failed to accept the DID Document (${message})`)
        }

        // Publish final endpoints on-chain
        try {
            await this.blockchain.register(endpoints)
        } catch (err: any) {
            // blockchain write failed, so roll back endpoint DID document storage on the endpoints
            await this.deleteFromEndpoints(endpoints)
            throw new Error(`Unable to save DID to blockchain: ${err.message}`)
        }

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
    public async update(didDocument: DIDDocument, controllerPrivateKey?: string): Promise<VdaDidEndpointResponses> {
        this.lastEndpointErrors = undefined
        if (!this.options.signKey) {
            throw new Error(`Unable to update DID Document. No private key specified in config.`)
        }

        const attributes = didDocument.export()
        if (attributes.created == attributes.updated) {
            throw new Error(`Unable to update DID Document. "updated" timestamp matches "created" timestamp.`)
        }

        didDocument.signProof(this.options.signKey)

        // Fetch the endpoint list from the blockchain
        const response: any = await this.blockchain.lookup(didDocument.id)
        const didInfo = interpretIdentifier(didDocument.id)

        let updateController = false

        const pattern = /0x[a-fA-F0-9]{40}/
        const currentController = response.didController.toLowerCase()
        const match = (<string> didDocument.export().controller!).toLowerCase().match(pattern)
        const didDocumentController = match![0].toLowerCase()

        // @ts-ignore
        if (currentController !== didDocumentController) {
            // Controller has changed, ensure we have a private key
            if (!controllerPrivateKey) {
                throw new Error(`Unable to update DID Document. Changing controller, but "controllerPrivateKey" not specified.`)
            }

            // Ensure new controller in the DID Document matches the private key
            const privateKeyAddress = ethers.utils.computeAddress(controllerPrivateKey).toLowerCase()
            if (privateKeyAddress !== didDocumentController) {
                throw new Error(`Unable to update DID Document. Changing controller, but private key doesn't match controller in DID Document`)
            }

            updateController = true
        }

        // Update all the endpoints
        const promises = []

        for (let i in response.endpoints) {
            const endpoint = response.endpoints[i]
            promises.push(Axios.put(`${endpoint}`, {
                document: didDocument.export()
            }));
        }

        const results: any = await Promise.allSettled(promises)
        const finalEndpoints: VdaDidEndpointResponses = {}
        let successCount = 0

        let failResponse: any = {}
        let failEndpointUri: string = ''
        for (let i in response.endpoints) {
            const result = results[i]
            const endpoint = response.endpoints[i]

            if (result.status == 'rejected') {
                const err = result.reason   // @todo: is this correct
                failResponse = {
                    status: 'fail',
                    message: err.response && err.response.data && err.response.data.message ? err.response.data.message : err.message
                }

                finalEndpoints[endpoint] = failResponse
                failEndpointUri = endpoint
            } else {
                finalEndpoints[endpoint] = {
                    status: 'success'
                }

                successCount++
            }
        }

        if (successCount === 0) {
            this.lastEndpointErrors = finalEndpoints
            throw new Error(`Unable to update DID: All endpoints failed to accept the DID Document (${failEndpointUri}: ${failResponse.message})`)
        }

        // If the controller doesn't match the DID, the controller may have changed
        if (updateController) {
            // If the DID controller has changed, update on-chain via `setController()`
            await this.blockchain.setController(controllerPrivateKey!)
        }

        return finalEndpoints
    }

    // @todo: make async for all endpoints
    private async deleteFromEndpoints(endpoints: string[]): Promise<any> {
        const did = this.options.identifier.toLowerCase()
        const nowInMinutes = Math.round((new Date()).getTime() / 1000 / 60)
        const proofString = `Delete DID Document ${did} at ${nowInMinutes}`
        const privateKey = new Uint8Array(Buffer.from(this.options.signKey!.substr(2),'hex'))
        const signature = EncryptionUtils.signData(proofString, privateKey)

        // Delete DID Document from all the endpoints
        const promises = []
        for (let i in endpoints) {
            const endpoint = endpoints[i]
            promises.push(Axios.delete(`${endpoints[i]}`, {
                headers: {
                    signature
                }
            }))
        }

        const results = await Promise.allSettled(promises)
        const finalEndpoints: VdaDidEndpointResponses = {}
        let successCount = 0

        for (let i in endpoints) {
            const endpoint = endpoints[i]
            const result = results[i]

            if (result.status == 'rejected') {
                const err = result.reason   // @todo: is this correct
                finalEndpoints[endpoint] = {
                    status: 'fail',
                    message: err.response && err.response.data && err.response.data.message ? err.response.data.message : err.message
                }
            } else {
                finalEndpoints[endpoint] = {
                    status: 'success'
                }

                successCount++
            }
        }

        return {
            successCount,
            finalEndpoints
        }
    }

    public async delete(): Promise<VdaDidEndpointResponses> {
        if (!this.options.signKey) {
            throw new Error(`Unable to delete DID. No private key specified in config.`)
        }

        const did = this.options.identifier.toLowerCase()

        // Fetch the endpoint list from the blockchain
        const response = await this.blockchain.lookup(did)

        // 1. Call revoke() on the DID registry
        await this.blockchain.revoke()

        // 2. Call DELETE on all endpoints
        const {
            successCount,
            finalEndpoints
        } = await this.deleteFromEndpoints(response.endpoints)


        if (successCount === 0) {
            this.lastEndpointErrors = finalEndpoints
            throw new Error(`Unable to delete DID: All endpoints failed to accept the delete request`)
        }

        return finalEndpoints
    }

    /**
     * Add a new to an existing DID
     * 
     * @param endpointUri 
     * @param verifyAllVersions 
     */
    public async addEndpoint(endpointUri: string, verifyAllVersions=false) {
        if (!this.options.signKey) {
            throw new Error(`Unable to create DID. No private key specified in config.`)
        }

        // 1. Fetch all versions of the DID
        const lookupResponse = await this.blockchain.lookup(this.options.identifier)
        const endpoints = lookupResponse.endpoints
        const versions = await this.fetchDocumentHistory(endpoints)

        const versionHistory = []
        for (let i in versions) {
            versionHistory.push(versions[i].export())
        }

        // 2. Call /migrate on the new endpoint
        // @todo: generate signature
        const proofString = '' 
        const signature = ''
        try {
            const response = await Axios.post(`${endpointUri}/migrate`, {
                versions: versionHistory,
                signature
            });
        } catch (err: any) {
            //console.error('addEndpoint error!!')
            if (err.response) {
                throw new Error(`Unable to add endpoint. ${err.response.data.message}`)
            }

            throw new Error(`Unable to add endpoint. ${err.message}`)
        }

        endpoints.push(endpointUri)

        // Update the blockchain
        await this.blockchain.register(endpoints)
    }

    // @todo: Implement
    public async removeEndpoint(did: string, endpoint: string) {
        if (!this.options.signKey) {
            throw new Error(`Unable to create DID. No private key specified in config.`)
        }
        
        // @todo
    }

    public getLastEndpointErrors() {
        return this.lastEndpointErrors
    }

    private async fetchDocumentHistory(endpoints: string[]): Promise<DIDDocument[]> {
        const documents: DIDDocument[] = []

        const endpointVersions: any = {}
        for (let i in endpoints) {
            const endpointUri = endpoints[i]
            endpointVersions[endpointUri] = []

            try {
                const response = await Axios.get(`${endpointUri}?allVersions=true`);
                if (response.data.status == 'success') {
                    for (let j in response.data.data.versions) {
                        const version = response.data.data.versions[j]
                        const doc = new DIDDocument(version)
                        endpointVersions[endpointUri].push(doc)
                    }
                }
            } catch (err: any) {
                throw new Error(`Unable to fetch DID Document history. ${err.message}`)
            }
        }

        // @todo: check consensus

        // Return consensus of versioned DID Document
        return endpointVersions[endpoints[0]]
    }

}