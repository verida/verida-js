import {
    ParsedDID,
    Resolver,
    DIDResolutionOptions,
    DIDDocument
} from 'did-resolver'
import { StorageLink } from '@verida/storage-link'

export function getResolver(): DIDResolutionOptions {
    async function resolve(
        did: string,
        parsed: ParsedDID,
        didResolver: Resolver,
        options: DIDResolutionOptions
    ): Promise<DIDDocument> {
        console.log(parsed)

        
        // {method: 'mymethod', id: 'abcdefg', did: 'did:mymethod:abcdefg/some/path#fragment=123', path: '/some/path', fragment: 'fragment=123'}
        const didDoc = new DIDDocument()

        // Return the DIDResolutionResult object
        return {
            didDocument: didDoc
        }
    }

    return { vaid: resolve }
}