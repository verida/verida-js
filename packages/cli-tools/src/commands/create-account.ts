import { Command } from 'command-line-interface';
import { CreateAccountOptions } from './interfaces';
import { AutoAccount } from '@verida/account-node';
import { Network } from '@verida/types';
import { Wallet } from '@verida/did-client';
import { DefaultNetworkBlockchainAnchors } from '@verida/vda-common';
import { NETWORK_STRINGS } from '../constants';
import { ethers } from 'ethers';
import { DIDDocument } from '@verida/did-document';
require('dotenv').config()

export const CreateAccount: Command<CreateAccountOptions> = {
    name: 'CreateAccount',
    description: 'Create a new Verida Account',
    optionDefinitions: [
      {
        name: 'network',
        description: `Verida network (${NETWORK_STRINGS.join(', ')})`,
        type: 'string',
        alias: 'n',
        defaultValue: 'myrtle',
        validate(val: string) {
          if (NETWORK_STRINGS.indexOf(val) === -1) {
            return false
          }
        }
      },
      {
        name: 'saveDID',
        description: 'Save this DID to the blockchain',
        type: 'boolean',
        alias: 's',
        defaultValue: false,
      },
    ],
    async handle ({ options }) {
        const network = <Network> options.network

        const randomWallet = ethers.Wallet.createRandom()
        const mnemonic = randomWallet.mnemonic!.phrase

        // Initialize Account
        const account = new AutoAccount({
            privateKey: mnemonic,
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

        if (options.saveDID) {
          await account.ensureAuthenticated()
          const didClient = await account.getDIDClient()
          const didDocument = new DIDDocument(did, didClient.getPublicKey())
          await didClient.save(didDocument)
          console.log('Saved DID')
        }

        const blockchain = DefaultNetworkBlockchainAnchors[network]
        const wallet = new Wallet(randomWallet.privateKey, blockchain.toString())
        console.log(`Wallet mnemonic: ${mnemonic}`)
        console.log(`Wallet private key: ${wallet.privateKey}`)
        console.log(`Wallet public key: ${wallet.publicKey}`)
    }
  };