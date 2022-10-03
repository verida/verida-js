import Axios from 'axios'
import { DIDDocument } from "@verida/did-document"
import { DIDDocument as DocInterface } from 'did-resolver'
const deepcopy = require('deepcopy')

import { default as VeridaWallet } from "./wallet"
import { Wallet } from '@ethersproject/wallet'

import { VdaDID, BulkDelegateParam, BulkAttributeParam, DelegateTypes } from '@verida/vda-did'
import { getResolver, verificationMethodTypes, interpretIdentifier } from '@verida/vda-did-resolver'
import { CallType, VeridaContract, VeridaMetaTransactionConfig, VeridaSelfTransactionConfig } from '@verida/web3'

import { JsonRpcProvider } from '@ethersproject/providers'

import { Resolver, ServiceEndpoint, VerificationMethod } from 'did-resolver'
// import { Signer } from 'ethers'
import { Signer } from '@ethersproject/abstract-signer';

// import { VeridaMetaTransactionConfig } from '@verida/web3/build/src/config'

import {isObject, removeCommonItems, getUpdateListFromDocument} from './helpers'
import { ethers } from 'ethers'

// Part of VeridaSelfTransactionConfig
interface VeridaSelfTransactionConfigPart  {
    signer?: Signer
    privateKey?: string
}

/**
 * veridaPrivateKey, callType, web3Config can be provided later by authenticate
 */

export interface DIDClientConfig {
    network: string             // `testnet` OR `mainnet`
    connectMode: string         // direct OR gasless @todo: use proper enums
    rpcUrl : string            // blockchain RPC URI to use
}

export class DIDClient {

    private config: DIDClientConfig

    // vda-did resolver
    private didResolver: Resolver

    // Verida Wallet Info
    private veridaWallet: VeridaWallet | undefined

    // private did?: string
    private vdaDid: VdaDID | undefined

    constructor(config: DIDClientConfig) {
        this.config = config

        const provider = new JsonRpcProvider(this.config.rpcUrl)

        //this.identifier = config.identifier

        //const { address, publicKey, network } = interpretIdentifier(this.identifier)
        //const net = network || (config.chainName || config.chainId)
        /*let networkString = net ? `${net}:` : ''
        if (networkString in ['mainnet:', '0x1:']) {
            networkString = ''
        }
        this.did = publicKey ? `did:ethr:${networkString}${publicKey}` : `did:ethr:${networkString}${address}`
        console.log('did-client DID : ', this.did)*/

        const vdaDidResolver = getResolver({
            chainId: this.config.network,
            provider,
            rpcUrl: this.config.rpcUrl,
        })
        
        this.didResolver = new Resolver(vdaDidResolver)
    }

    /**
     * Unlock save() function by providing verida signing key.
     * @param veridaPrivateKey private key of verida. Used to sign transactions for smart contract
     * @param callType Blockchain interaction mode. 'web3' | 'gasless'
     * @param web3Config Web3 configuration for callType.
     */
    public authenticate(
        veridaPrivateKey: string,
        callType: CallType,
        web3Config: VeridaSelfTransactionConfigPart|VeridaMetaTransactionConfig
    ) { 
        this.veridaWallet = new VeridaWallet(veridaPrivateKey)
        const provider = new JsonRpcProvider(this.config.rpcUrl)

        const _web3Config = callType === 'gasless' ?
            <VeridaMetaTransactionConfig>web3Config :
            <VeridaSelfTransactionConfig>{
                ...<VeridaSelfTransactionConfigPart>web3Config,
                provider: provider,
                rpcUrl: this.config.rpcUrl,
            }

        this.vdaDid = new VdaDID({
            identifier: this.veridaWallet.did,
            vdaKey: this.veridaWallet.privateKey,   // should this be buffer?
            chainNameOrId: this.config.network,
            callType: callType,
            web3Options: _web3Config
        })
    }
    
    public getDid(): string | undefined {
        if (this.veridaWallet !== undefined) {
            return this.veridaWallet.did
        }

        return undefined
    }
    
    public getPublicKey(): string | undefined {
        if (this.veridaWallet !== undefined) {
            return this.veridaWallet.publicKey
        }

        return undefined
    }

    /**
     * Save DIDDocument to the chain
     * 
     * @param document Updated DIDDocuent
     * @returns true if success.
     */
    public async save(document: DIDDocument | undefined): Promise<boolean> {
        if (this.veridaWallet === undefined) {
            throw new Error("Unable to save DIDDocument. No private key.")
        }

        // Fetch the existing doc. This creates a new, empty doc if not found
        const existingDoc = await this.get(document!.id)
        const comparisonResult = existingDoc.compare(document)

        const {delegateList: revokeDelegateList, attributeList: revokeAttributeList} = getUpdateListFromDocument(comparisonResult.remove)
        const {delegateList: addDelegateList, attributeList: addAttributeList} = getUpdateListFromDocument(comparisonResult.add)

        if (revokeDelegateList.length > 0 || revokeAttributeList.length > 0) {
            const bulkRevokeResult = await this.vdaDid!.bulkRevoke(revokeDelegateList, revokeAttributeList)
        }

        if (addDelegateList.length > 0 || addAttributeList.length > 0) {
            const bulkAddResult = await this.vdaDid!.bulkAdd(addDelegateList, addAttributeList)
        }

        /*
        // @todo: Alex change owner implemented. bulkAdd() should be called with new controlle'rs privatekey
        // Implement later
        if (comparisonResult.controller !== undefined) {
            // Change Owner

        }
        */

        console.log('DIDClient.save() completed successfully')
        return true
    }

    /**
     * Get original document loaded from blockchain. Creates a new document if it didn't exist
     * 
     * @returns DID Document instance
     */
    public async get(did: string): Promise<DIDDocument> {
        const resolutionResult = await this.didResolver.resolve(did)
        //console.log('did-client get : returned ', resolutionResult)

        if (resolutionResult.didResolutionMetadata && resolutionResult.didResolutionMetadata.error) {
            throw new Error(`DID resolution error (${resolutionResult.didResolutionMetadata.error}): ${resolutionResult.didResolutionMetadata.message}`)
        }

        if (resolutionResult.didDocument !== null) {
            //console.log('have did doc', resolutionResult.didDocument!)
            // vda-did-resolver always return didDocument if no exception occured while parsing
            return new DIDDocument(resolutionResult.didDocument!)

            // Test code
            // this.didDoc = {
            //     '@context': [
            //       'https://www.w3.org/ns/did/v1',
            //       'https://w3id.org/security/suites/secp256k1recovery-2020/v2'
            //     ],
            //     id: 'did:ethr:0x61:0x599b3912A63c98dC774eF3E60282fBdf14cda748',
            //     verificationMethod: [
            //         {
            //           id: 'did:ethr:0x61:0x599b3912A63c98dC774eF3E60282fBdf14cda748#controller',
            //           type: 'EcdsaSecp256k1RecoveryMethod2020',
            //           controller: 'did:ethr:0x61:0x599b3912A63c98dC774eF3E60282fBdf14cda748',
            //           blockchainAccountId: '0x599b3912A63c98dC774eF3E60282fBdf14cda748@eip155:97'
            //         },
            //         {
            //           id: 'did:ethr:0x61:0x599b3912A63c98dC774eF3E60282fBdf14cda748?context=0x678904eb5c3f53d8506e7085dfbb0ef333c5f7d0769bcaf4ca2dc0ca46d00001',
            //           type: 'EcdsaSecp256k1VerificationKey2019',
            //           controller: 'did:ethr:0x61:0x599b3912A63c98dC774eF3E60282fBdf14cda748',
            //           publicKeyHex: '12345bb792710e80b7605fe4ac680eb7f070ffadcca31aeb0312df80f7300001'
            //         },
            //         {
            //           id: 'did:ethr:0x61:0x599b3912A63c98dC774eF3E60282fBdf14cda748?context=0x67890c45e3ad1ba47c69f266d6c49c589b9d70de837e318c78ff43c7f0b00003',
            //           type: 'Ed25519VerificationKey2018',
            //           controller: 'did:ethr:0x61:0x599b3912A63c98dC774eF3E60282fBdf14cda748',
            //           publicKeyBase58: '2E4cfzc9Kf2nvScMZ2bJwGKPn19TJYvPE98D8RCguqL6'
            //         }
            //     ],
            //     assertionMethod: [
            //         'did:ethr:0x61:0x599b3912A63c98dC774eF3E60282fBdf14cda748#controller',
            //         'did:ethr:0x61:0x599b3912A63c98dC774eF3E60282fBdf14cda748?context=0x678904eb5c3f53d8506e7085dfbb0ef333c5f7d0769bcaf4ca2dc0ca46d00001',
            //         'did:ethr:0x61:0x599b3912A63c98dC774eF3E60282fBdf14cda748?context=0x67890c45e3ad1ba47c69f266d6c49c589b9d70de837e318c78ff43c7f0b00003'
            //     ],
            //     authentication: [
            //         'did:ethr:0x61:0x599b3912A63c98dC774eF3E60282fBdf14cda748#controller',
            //         'did:ethr:0x61:0x599b3912A63c98dC774eF3E60282fBdf14cda748?context=0x678904eb5c3f53d8506e7085dfbb0ef333c5f7d0769bcaf4ca2dc0ca46d00001'
            //     ],
            //     service: [
            //         {
            //             id: 'did:ethr:0x61:0x599b3912A63c98dC774eF3E60282fBdf14cda748?context=0x84e5fb4eb5c3f53d8506e7085dfbb0ef333c5f7d0769bcaf4ca2dc0ca4698fd4&type=message',
            //             type: 'VeridaMessage',
            //             serviceEndpoint: 'https://db.testnet.verida.io:5002'
            //         },
            //         {
            //             id: 'did:ethr:0x61:0x599b3912A63c98dC774eF3E60282fBdf14cda748?context=0xcfbf4621af64386c92c0badd0aa3ae3877a6ea6e298dfa54aa6b1ebe00769b28&type=database',
            //             type: 'VeridaDatabase',
            //             serviceEndpoint: 'https://db.testnet.verida.io:5002'
            //         }
            //     ]
            //   }
        } else {
            throw new Error(`DID resolution error (${resolutionResult.didResolutionMetadata.error}): ${resolutionResult.didResolutionMetadata.message}`)
            /*console.log('creating empty did doc')
            const baseDIDDocument: DocInterface = {
                '@context': [
                    'https://www.w3.org/ns/did/v1',
                    'https://identity.foundation/EcdsaSecp256k1RecoverySignature2020/lds-ecdsa-secp256k1-recovery2020-0.0.jsonld',
                ],
                id: did,
                verificationMethod: [],
                authentication: [],
                assertionMethod: [],
            }
            return new DIDDocument(baseDIDDocument)*/
        }
    }
}