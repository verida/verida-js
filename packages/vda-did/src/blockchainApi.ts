import { VdaApiConfigurationOptions } from "./interfaces"

export default class BlockchainApi {

    private options: VdaApiConfigurationOptions

    constructor(options: VdaApiConfigurationOptions) {
        this.options = options
    }

    public async lookup(didAddress: string) {
        // @todo
    }

    public async register(didAddress: string, endpoints: string[], privateKey: string) {
        if (!this.options.privateKey) {
            throw new Error(`Unable to create DID. No private key specified in config.`)
        }

        // @todo
    }

    public async setController(didAddress: string, controllerAddress: string, privateKey: string) {
        if (!this.options.privateKey) {
            throw new Error(`Unable to create DID. No private key specified in config.`)
        }
        // @todo
    }

    public async revoke(didAddress: string, privateKey: string) {
        if (!this.options.privateKey) {
            throw new Error(`Unable to create DID. No private key specified in config.`)
        }
        // @todo
    }

}