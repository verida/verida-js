import { AccountConfig, AccountNodeConfig } from "@verida/types";
import LimitedAccount from "./limited";
import { Keyring } from "@verida/keyring";

export default class ContextAccount extends LimitedAccount {

    private contextDid: string
    private contextSeed: string

    constructor(autoConfig: AccountNodeConfig, did: string, contextName: string, contextSeed: string, accountConfig?: AccountConfig) {
        super(autoConfig, accountConfig)
        this.contextDid = did.toLowerCase()
        this.signingContexts = [contextName]
        this.contextSeed = contextSeed
    }

    public async keyring(contextName: string): Promise<Keyring> {
        if (this.signingContexts.indexOf(contextName) == -1) {
            throw new Error(`Account does not support context: ${contextName}`)
        }

        return new Keyring(this.contextSeed)
    }

    public async did(): Promise<string> {
        return this.contextDid
    }

}