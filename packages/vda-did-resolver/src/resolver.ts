
import { ConfigurationOptions } from "./interfaces";
import {
    DIDResolutionOptions,
    DIDResolutionResult,
    DIDResolver,
    ParsedDID,
    Resolvable
  } from "did-resolver";
import VdaApi from "./api";

/**
 * Create a VdaDidResolver instance and return it
 * @param options Configurations
 * @returns VdaDidResolver instance
 */
 export function getResolver(
    options: ConfigurationOptions
  ): Record<string, DIDResolver> {
    return new VdaDidResolver(options).build();
}

class VdaDidResolver {

    private options: ConfigurationOptions
    private api: VdaApi

    constructor(options: ConfigurationOptions) {
        this.options = options
        this.api = new VdaApi(options)
    }

    /** Resolve a DIDDocument from a DID */
    public async resolve(
        did: string,
        parsed: ParsedDID,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _unused: Resolvable,
        options: DIDResolutionOptions
        ): Promise<DIDResolutionResult> {

        const didDoc = await this.api.resolve(parsed)

        // Return the DIDResolutionResult object
        return {
            didResolutionMetadata: { contentType: 'application/did+ld+json' },
            didDocument: didDoc,
            didDocumentMetadata: {}
        }
    }

    build(): Record<string, DIDResolver> {
        return { vda: this.resolve.bind(this) };
    }

}