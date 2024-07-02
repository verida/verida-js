import { Command } from 'command-line-interface';
import { GetAccountInfoOptions } from './interfaces';
import { Client } from '@verida/client-ts';
import { AutoAccount } from '@verida/account-node';
import { Network } from '@verida/types';
import { Wallet } from '@verida/did-client';
import { DefaultNetworkBlockchainAnchors } from '@verida/vda-common';
require('dotenv').config()

export const GetAccountInfo: Command<GetAccountInfoOptions> = {
    name: 'GetAccountInfo',
    description: 'Get the DID, Private key and Public key for a Verida Account.',
    optionDefinitions: [
      {
        name: 'privateKey',
        description: 'Verida network private key (or seed phrase) of the sender',
        type: 'string',
        defaultValue: process.env.privateVeridaKey,
        alias: 'k'
      },
      {
        name: 'network',
        description: 'Verida network (testnet, mainnet)',
        type: 'string',
        alias: 'n',
        defaultValue: 'myrtle',
        validate(val: string) {
          const valid = ['banksia', 'myrtle', 'devnet']
          if (valid.indexOf(val) === -1) {
            return false
          }
        }
      },
    ],
    async handle ({ options }) {
        const network = <Network> options.network
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

      const did = await account.did()
      console.log(`DID: ${did}`)

      const blockchain = DefaultNetworkBlockchainAnchors[network]
      const wallet = new Wallet(options.privateKey, blockchain.toString())
      console.log(`Wallet private key: ${wallet.privateKey}`)
      console.log(`Wallet public key: ${wallet.publicKey}`)
    }
  };