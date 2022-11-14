import { VdaDidConfigurationOptions } from "./interfaces"

export interface LookupResponse {
    didControllerAddress: string
    endpoints: string[]
}

export default class BlockchainApi {

    private options: VdaDidConfigurationOptions

    constructor(options: VdaDidConfigurationOptions) {
        this.options = options
    }

    public async lookup(didAddress: string): Promise<LookupResponse> {
        // @todo: Fetch actual on chain values

        // return values for testing
        return {
            didControllerAddress: didAddress,
            endpoints: [`http://localhost:5000/did/did:vda:testnet:${didAddress}`]
        }
    }

    public async register(didAddress: string, endpoints: string[]) {
        if (!this.options.vdaKey) {
            throw new Error(`Unable to create DID. No private key specified in config.`)
        }

        // @todo
    }

    public async setController(didAddress: string, controllerAddress: string) {
        if (!this.options.vdaKey) {
            throw new Error(`Unable to create DID. No private key specified in config.`)
        }
        // @todo
    }

    public async revoke(didAddress: string) {
        if (!this.options.vdaKey) {
            throw new Error(`Unable to create DID. No private key specified in config.`)
        }
        // @todo
    }

}