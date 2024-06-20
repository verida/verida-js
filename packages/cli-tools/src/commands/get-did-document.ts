import { Command } from 'command-line-interface';
import { GetDIDDocumentOptions } from './interfaces';
import { getResolver } from '@verida/vda-did-resolver'
import { Resolver } from 'did-resolver'
import { DIDDocument } from '@verida/did-document'
import { VeridaDocInterface } from '@verida/types'

export const GetDIDDocument: Command<GetDIDDocumentOptions> = {
    name: 'GetDIDDocument',
    description: 'Get the DID Document for a Verida DID',
    optionDefinitions: [
      {
        name: 'did',
        description: 'DID that should receive the inbox message',
        type: 'string',
        alias: 'd',
      },
    ],

    async handle ({ options }) {
        const vdaDidResolver = getResolver()
        const didResolver = new Resolver(vdaDidResolver)
        const response = await didResolver.resolve(options.did)
        const didDocument = new DIDDocument(<VeridaDocInterface> response.didDocument)

        // Output with pretty JSON formatting
        console.log(JSON.stringify(didDocument, null, 2))
    }
  };