import { Command } from 'command-line-interface';
import { SendInboxMessageOptions } from './interfaces';
import { Client } from '@verida/client-ts';
import { AutoAccount } from '@verida/account-node';
import { Network } from '@verida/types';
import { NETWORK_STRINGS } from '../constants';
require('dotenv').config()

export const SendInboxMessage: Command<SendInboxMessageOptions> = {
    name: 'SendInboxMessage',
    description: 'Send a test inbox message to a DID',
    optionDefinitions: [
      {
        name: 'did',
        description: 'DID that should receive the inbox message',
        type: 'string',
        alias: 'd',
        isRequired: true
      },
      {
        name: 'privateKey',
        description: 'Verida network private key (or seed phrase) of the sender',
        type: 'string',
        defaultValue: process.env.privateVeridaKey,
        alias: 'k'
      },
      {
        name: 'message',
        description: 'Message to send the DID',
        type: 'string',
        defaultValue: 'Test message sent from command line',
        alias: 'm',
      },
      {
        name: 'sendContext',
        description: 'Name of the application context to send the inbox message from',
        type: 'string',
        defaultValue: process.env.defaultContextName ? process.env.defaultContextName : 'Verida: Command Line Interface',
      },
      {
        name: 'receiveContext',
        description: 'Name of the application context to send the inbox message to',
        type: 'string',
        defaultValue: 'Verida: Vault',
        alias: 'c',
      },
      {
        name: 'subject',
        description: 'Subject of the test message',
        type: 'string',
        defaultValue: 'New CLI test message',
        alias: 's',
      },
      {
        name: 'network',
        description: 'Verida network (testnet, mainnet)',
        type: 'string',
        alias: 'n',
        defaultValue: 'myrtle',
        validate(val: string) {
          if (NETWORK_STRINGS.indexOf(val) === -1) {
            return false
          }
        }
      },
      /*
      {
        name: 'network',
        description: 'Verida network (banksia, myrtle)',
        type: 'string',
        alias: 'n',
        defaultValue: 'myrtle',
        validate(val: string) {
          const valid = ['banksia', 'myrtle']
          if (valid.indexOf(val) === -1) {
            return false
          }
        }
      },*/
    ],
    async handle ({ options }) {
      console.log(`Sending message to ${options.did} on network ${options.network}.\n\nSubject: ${options.subject}\n${options.message}`);

      // Initialize Account
      const account = new AutoAccount({
        privateKey: options.privateKey,
        network: <Network> options.network,
        didClientConfig: {
          callType: 'web3',
          web3Config: {
            // Set a dummy private key as we shouldn't need to create a DID automatically
            // The sending DID should already exist
            privateKey: process.env.privateBlockchainKey
          }
        }
      })

      const client = new Client({
        network: <Network> options.network
      })

      const sendingDID = await account.did()
      await client.connect(account)
      const context = await client.openContext(options.sendContext, true)

      try {
        const messaging = await context!.getMessaging({})
        await messaging.send(options.did, 'inbox/type/message', {
          data: [{
          subject: options.subject,
          message: options.message
        }]}, options.subject, {
          did: options.did,
          recipientContextName: options.receiveContext
        })

        console.log(`Inbox message successfully sent from ${sendingDID} to ${options.did}`)
      } catch (err: any) {
        console.error(err.message)
      }

      await context!.close({
        clearLocal: true
      })
    }
  };