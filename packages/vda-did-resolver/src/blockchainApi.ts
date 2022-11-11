import { DIDDocument } from "did-resolver"
import { ConfigurationOptions } from "./interfaces"

export default class BlockchainApi {

    private options: ConfigurationOptions

    constructor(options: ConfigurationOptions) {
        this.options = options
    }

    public async lookup(didAddress: string) {
        // @todo
    }

    public async register(didAddress: string, endpoints: string[]) {
        if (!this.options.privateKey) {
            throw new Error(`Unable to create DID. No private key specified in config.`)
        }

        // @todo
    }

    public async setController(didAddress: string, controllerAddress: string) {
        if (!this.options.privateKey) {
            throw new Error(`Unable to create DID. No private key specified in config.`)
        }
        // @todo
    }

    public async revoke(didAddress: string) {
        if (!this.options.privateKey) {
            throw new Error(`Unable to create DID. No private key specified in config.`)
        }
        // @todo
    }

}