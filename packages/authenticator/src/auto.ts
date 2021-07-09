import AuthenticatorInterface from "./authenticator-interface";
import CeramicClient from '@ceramicnetwork/http-client'


/**
 * An Authenticator that automatically signs everything
 */
export default class AutoAuthenticator implements AuthenticatorInterface {

    ceramic: CeramicClient

    constructor(ceramic: CeramicClient) {
        this.ceramic = ceramic

        if (!ceramic.did) {
            throw new Error('Ceramic client is not authenticated with a valid DID')
        }
    }

    async sign(input: string): Promise<string> {
        const jws = await this.ceramic.did!.createJWS(input)
        return jws.signatures[0].signature
    }

    async did(): Promise<string> {
        return this.ceramic.did!.id
    }

}