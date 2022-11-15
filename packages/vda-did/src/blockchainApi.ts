import { VdaDidConfigurationOptions } from "./interfaces"

export interface LookupResponse {
    didController: string
    endpoints: string[]
}

export default class BlockchainApi {

    private options: VdaDidConfigurationOptions

    constructor(options: VdaDidConfigurationOptions) {
        this.options = options
    }

    public async lookup(did: string): Promise<LookupResponse> {
        // @todo: Fetch actual on chain values

        // return values for testing
        return {
            didController: did,
            endpoints: [`http://localhost:5000/did/${did}`]
        }
    }

    public async register(did: string, endpoints: string[]) {
        if (!this.options.vdaKey) {
            throw new Error(`Unable to create DID. No private key specified in config.`)
        }

        // @todo
    }

    public async setController(did: string, controllerAddress: string) {
        if (!this.options.vdaKey) {
            throw new Error(`Unable to create DID. No private key specified in config.`)
        }
        // @todo
    }

    public async revoke(did: string) {
        if (!this.options.vdaKey) {
            throw new Error(`Unable to create DID. No private key specified in config.`)
        }
        // @todo
    }

}