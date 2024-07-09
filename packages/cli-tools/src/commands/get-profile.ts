import { Command } from 'command-line-interface';
import { GetProfileOptions } from './interfaces';
import { Network } from '@verida/types';
import { Client } from '@verida/client-ts';
require('dotenv').config()

export const GetProfile: Command<GetProfileOptions> = {
    name: 'GetProfile',
    description: 'Get the public profile of a Verida Account',
    optionDefinitions: [
      {
        name: 'did',
        description: 'Verida DID',
        type: 'string',
        alias: 'd'
      },
      {
        name: 'contextName',
        type: 'string',
        defaultValue: 'Verida: Vault',
        alias: 'c'
      },
      {
        name: 'profileName',
        type: 'string',
        defaultValue: 'basicProfile',
        alias: 'p'
      },
      {
        name: 'fallbackContext',
        type: 'string',
        alias: 'f'
      },
      {
        name: 'ignoreCache',
        type: 'boolean',
        defaultValue: true,
        alias: 'i'
      }
    ],
    async handle ({ options }) {
        let network: Network
        if (options.did.match('mainnet') || options.did.match('myrtle')) {
            network = Network.MYRTLE
        } else {
            network = Network.BANKSIA
        }

        const client = new Client({
            network,
            didClientConfig: {
                network
            },
        })

        const profile = await client.getPublicProfile(options.did, options.contextName, options.profileName, options.fallbackContext, options.ignoreCache)
        console.log(`Profile located:`)
        console.log(profile)
    }
};