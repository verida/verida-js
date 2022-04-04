import {
    ParsedDID,
    Resolver,
    DIDResolutionOptions,
    DIDDocument
} from 'did-resolver'
import { DIDClient } from '@verida/did-client'
import config from './config'
import { EnvironmentType } from './interfaces'

export function getResolver(environment: EnvironmentType): DIDResolutionOptions {
    async function resolve(
        did: string,
        parsed: ParsedDID,
        didResolver: Resolver,
        options: DIDResolutionOptions
    ): Promise<DIDDocument> {
        // {method: 'mymethod', id: 'abcdefg', did: 'did:mymethod:abcdefg/some/path#fragment=123', path: '/some/path', fragment: 'fragment=123'}

        const didClient = new DIDClient(config.environments[environment].didServerUrl)
        const didDocument = await didClient.get(did)
        const doc: DIDDocument = <DIDDocument>didDocument!.export()

        return doc
    }

    return { vda: resolve }
}


