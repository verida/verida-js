import { Command } from 'command-line-interface';
import { SetProfileOptions } from './interfaces';
import { Network } from '@verida/types';
import { Client } from '@verida/client-ts';
import { NETWORK_STRINGS } from '../constants';
import { AutoAccount } from '@verida/account-node';
require('dotenv').config()

export const SetProfile: Command<SetProfileOptions> = {
    name: 'SetProfile',
    description: 'Set the public profile data of a Verida Account',
    optionDefinitions: [
      {
        name: 'privateKey',
        description: 'Verida private key of the DID',
        type: 'string',
        alias: 'k'
      },
      {
        name: 'contextName',
        type: 'string',
        defaultValue: 'Verida: Vault',
      },
      {
        name: 'network',
        description: `Verida network (${NETWORK_STRINGS.join(', ')})`,
        type: 'string',
        defaultValue: 'myrtle',
        validate(val: string) {
          if (NETWORK_STRINGS.indexOf(val) === -1) {
            return false
          }
        }
      },
      {
        name: 'name',
        type: 'string',
        isRequired: true,
        alias: 'n'
      },
      {
        name: 'description',
        type: 'string',
        defaultValue: '',
        alias: 'd'
      },
      {
        name: 'country',
        type: 'string',
        defaultValue: '',
        alias: 'c'
      },
    ],
    async handle ({ options }) {
        const network = <Network> options.network

        const client = new Client({
            network,
            didClientConfig: {
                network
            },
        })

        // Initialize Account
        const account = new AutoAccount({
            privateKey: options.privateKey,
            network,
            didClientConfig: {
                callType: 'web3',
                web3Config: {
                    // Set a dummy private key as we shouldn't need to create a DID automatically
                    // The sending DID should already exist
                    privateKey: process.env.privateBlockchainKey
                }
            }
        })

        await client.connect(account)
        const context = await client.openContext(options.contextName)
        const profile = await context!.openProfile()

        console.log(`Profile located:`)
        console.log(await profile!.getMany({}, {}))

        const saveResult = await profile!.setMany({
            name: options.name,
            description: options.description,
            country: options.country
        })

        console.log(`Profile updated:`)
        console.log(await profile!.getMany({}, {}))

        await context!.close()
    }
};