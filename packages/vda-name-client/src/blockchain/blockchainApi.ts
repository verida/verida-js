
// @todo: configure this same as vda-did
export interface NameClientConfig {
}

export default class BlockchainApi {

    private config: NameClientConfig

    public constructor(config: NameClientConfig) {
        this.config = config
    }

    public async register(did: string, username: string) {
        // @todo: Register a name against a DID
        // @throws new Error(`DID not found.`)
        // @throws new Error(`DID has too many usernames.`)
    }

    public async getUsernames(did: string): Promise<string[]> {
        // @todo: Fetch list of usernames associated with a DID
        // @throws new Error(`DID not found.`)
        return []
    }

    public getDid(username: string): Promise<string> {
        // @todo: Return the DID for a given username
        // @throws new Error(`Username not found.`)
    }

}