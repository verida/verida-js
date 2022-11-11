import { ConfigurationOptions } from "./interfaces"
import {
    DIDDocument,
    ParsedDID
  } from "did-resolver";
import BlockchainApi from "./blockchainApi";

export default class VdaApi {

    private options: ConfigurationOptions
    private blockchain: BlockchainApi

    constructor(options: ConfigurationOptions) {
        this.options = options
        this.blockchain = new BlockchainApi(options)
    }

    public async resolve(parsed: ParsedDID) {
        const didAddress = parsed.id
        
        //timestamp?: number, fullVerification?: boolean

    }

    public async create(didDocument: DIDDocument, endpoints: string[]) {
        if (!this.options.privateKey) {
            throw new Error(`Unable to create DID. No private key specified in config.`)
        }
        // @todo
    }

    public async update(didDocument: DIDDocument) {
        if (!this.options.privateKey) {
            throw new Error(`Unable to create DID. No private key specified in config.`)
        }
        // @todo
    }

    public async delete(didAddress: string) {
        if (!this.options.privateKey) {
            throw new Error(`Unable to create DID. No private key specified in config.`)
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