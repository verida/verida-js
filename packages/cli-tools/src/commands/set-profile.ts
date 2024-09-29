import { Command } from 'command-line-interface';
import { SetProfileOptions } from './interfaces';
import { IProfile, Network } from '@verida/types';
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
        name: 'storageNodes',
        description: 'Storage nodes to use for the profile (comma separated). ie: `http://node1.com/,http://node2.com`',
        type: 'string'
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

        let accountConfig = undefined
        if (options.storageNodes) {
          console.log('Setting storage nodes: ', options.storageNodes)
          const storageNodes = options.storageNodes.split(',')
          accountConfig = {
            defaultDatabaseServer: {
              type: 'VeridaDatabase',
              endpointUri: storageNodes
            },
            defaultMessageServer: {
              type: 'VeridaMessage',
              endpointUri: storageNodes
            }
          }
        }

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
        }, accountConfig)
        const did = await account.did()

        await client.connect(account)
        const context = await client.openContext(options.contextName)
        const profile = <IProfile> await context!.openProfile()

        console.log(`Profile located for ${did}:`)
        console.log(await profile.getMany({}, {}))

        const saveResult = await profile.setMany({
            name: options.name ? options.name : undefined,
            description: options.description ? options.description : undefined,
            country: options.country ? options.country : undefined
        })

        if (!saveResult) {
          console.log('Error saving profile')
          console.log(await profile.getErrors())
        } else {
          console.log(`Profile updated:`)
          console.log(await profile!.getMany({}, {}))
        }

        await context!.close()
    }
};