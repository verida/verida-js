import Axios from 'axios'
import { DIDDocument } from "@verida/did-document"
import { DIDDocument as DocInterface } from 'did-resolver'
const deepcopy = require('deepcopy')

import { default as VeridaWallet } from "./wallet"
import { Wallet } from '@ethersproject/wallet'

import { VdaDID, BulkDelegateParam, BulkAttributeParam, DelegateTypes } from '@verida/vda-did'
import { getResolver, verificationMethodTypes, interpretIdentifier } from '@verida/vda-did-resolver'
import { CallType, VeridaContract, VeridaMetaTransactionConfig, VeridaSelfTransactionConfig } from '@verida/web3'

import { Provider } from '@ethersproject/providers'

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
    // vda-did resolver - only
    identifier : string // string value "vda:did:0x12...f" or ethereum address
    chainName? : string 
    chainId? : string | number

    // common to vda-did resolver & vda-did self transaction config
    provider? : Provider
    rpcUrl? : string
    registry?: string
    web3?: any
}

// Interfaces for saving DID Document
interface VerificationMethodBase {
    id: string
    type: string
    controller: string
}

interface Controller extends VerificationMethodBase {
    blockchainAccountId: string
}

/**
 * Interface to DIDClient instance
 */
export interface DIDClient {

    authenticate(
        veridaPrivateKey: string,
        callType: CallType,
        web3Config: VeridaSelfTransactionConfigPart|VeridaMetaTransactionConfig
    ): void;

    getDid(): string | undefined;

    getPublicKey(): string | undefined;

    save(document: DIDDocument): Promise<boolean>;

    get(did?: string): Promise<DIDDocument | null>
    
}

/**
 * Create instance of DIDClient interface. And load DIDDocument from chain
 *  * 
 * @param config : cofiguration for DIDClientImpl class
 * @returns DIDClient 
 */
export async function createDIDClient(config:DIDClientConfig) : Promise<DIDClient> {
    const didClient = new DIDClientImpl(config)

    return didClient
}

class DIDClientImpl implements DIDClient {

    private config: DIDClientConfig
    private identifier: string // Inputed value in consturctor
    private did: string // Interpreted did from identifier

    // vda-did resolver
    private didResolver: Resolver

    // Verida Wallet Info
    private veridaPrivateKey: Uint8Array | undefined
    private veridaWallet: VeridaWallet | undefined
    // private did?: string
    private vdaDid: VdaDID | undefined

    constructor(config: DIDClientConfig) {
        this.config = config
        this.identifier = config.identifier

        const { address, publicKey, network } = interpretIdentifier(this.identifier)
        const net = network || (config.chainName || config.chainId)
        let networkString = net ? `${net}:` : ''
        if (networkString in ['mainnet:', '0x1:']) {
            networkString = ''
        }
        this.did = publicKey ? `did:vda:${networkString}${publicKey}` : `did:vda:${networkString}${address}`
        // console.log('did-client DID : ', this.did)

        const vdaDidResolver = getResolver({
            name: config.chainName,
            provider: config.provider,
            rpcUrl: config.rpcUrl,
            registry: config.registry,
            chainId: config.chainId,
            web3: config.web3
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
        this.veridaPrivateKey = this.veridaWallet.privateKeyBuffer

        const _web3Config = callType === 'gasless' ?
            <VeridaMetaTransactionConfig>web3Config :
            <VeridaSelfTransactionConfig>{
                ...<VeridaSelfTransactionConfigPart>web3Config,
                provider: this.config.provider,
                rpcUrl: this.config.rpcUrl,
                web3: this.config.web3
            }

        this.vdaDid = new VdaDID({
            identifier: this.identifier,
            vdaKey: this.veridaWallet.privateKey,
            chainNameOrId: this.config.chainName || this.config.chainId,
            callType: callType,
            web3Options: _web3Config
        })
    }
    
    public getDid(): string | undefined {
        if (this.veridaWallet !== undefined) {
            return this.vdaDid!.did
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
            return Promise.reject('Not authenticated.')
        }

        if (document === undefined) {
            return Promise.reject("Empty document")
        }

        const orgDID = interpretIdentifier(this.identifier)
        const newDID = interpretIdentifier(document.id)

        if (orgDID.address !== newDID.address) {
            throw new Error("DID of document is not matched to did-client")
        }

        const orgDoc = await this.get()

        const comparisonResult = orgDoc.compare(document)

        const {delegateList: revokeDelegateList, attributeList: revokeAttributeList} = getUpdateListFromDocument(comparisonResult.remove)
        const {delegateList: addDelegateList, attributeList: addAttributeList} = getUpdateListFromDocument(comparisonResult.add)

        // console.log('RevokeList', revokeDelegateList, revokeAttributeList)
        // console.log('AddList', addDelegateList, addAttributeList)

        if (revokeDelegateList.length > 0 || revokeAttributeList.length > 0) {
            await this.vdaDid!.bulkRevoke(revokeDelegateList, revokeAttributeList)
        }

        if (addDelegateList.length > 0 || addAttributeList.length > 0) {
            await this.vdaDid!.bulkAdd(addDelegateList, addAttributeList)
        }

        /*
        // To-do : Alex change owner implemented. bulkAdd() should be called with new controlle'rs privatekey
        // Implement later
        if (comparisonResult.controller !== undefined) {
            // Change Owner

        }
        */

        return Promise.resolve(true)
    }

    /**
     * 
     * @returns Get original document loaded from blockchain
     */
    public async get(did = this.did): Promise<DIDDocument> {
        const resolutionResult = await this.didResolver.resolve(did)
        return new Promise<DIDDocument>((resolve, reject) => {
            // console.log('did-client get : returned ', resolutionResult)
            if (resolutionResult.didDocument !== null) {
                // vda-did-resolver always return didDocument if no exception occured while parsing
                resolve(new DIDDocument(resolutionResult.didDocument!))

                // Test code
                // this.didDoc = {
                //     '@context': [
                //       'https://www.w3.org/ns/did/v1',
                //       'https://w3id.org/security/suites/secp256k1recovery-2020/v2'
                //     ],
                //     id: 'did:vda:0x61:0x599b3912A63c98dC774eF3E60282fBdf14cda748',
                //     verificationMethod: [
                //         {
                //           id: 'did:vda:0x61:0x599b3912A63c98dC774eF3E60282fBdf14cda748#controller',
                //           type: 'EcdsaSecp256k1RecoveryMethod2020',
                //           controller: 'did:vda:0x61:0x599b3912A63c98dC774eF3E60282fBdf14cda748',
                //           blockchainAccountId: '0x599b3912A63c98dC774eF3E60282fBdf14cda748@eip155:97'
                //         },
                //         {
                //           id: 'did:vda:0x61:0x599b3912A63c98dC774eF3E60282fBdf14cda748?context=0x678904eb5c3f53d8506e7085dfbb0ef333c5f7d0769bcaf4ca2dc0ca46d00001',
                //           type: 'EcdsaSecp256k1VerificationKey2019',
                //           controller: 'did:vda:0x61:0x599b3912A63c98dC774eF3E60282fBdf14cda748',
                //           publicKeyHex: '12345bb792710e80b7605fe4ac680eb7f070ffadcca31aeb0312df80f7300001'
                //         },
                //         {
                //           id: 'did:vda:0x61:0x599b3912A63c98dC774eF3E60282fBdf14cda748?context=0x67890c45e3ad1ba47c69f266d6c49c589b9d70de837e318c78ff43c7f0b00003',
                //           type: 'Ed25519VerificationKey2018',
                //           controller: 'did:vda:0x61:0x599b3912A63c98dC774eF3E60282fBdf14cda748',
                //           publicKeyBase58: '2E4cfzc9Kf2nvScMZ2bJwGKPn19TJYvPE98D8RCguqL6'
                //         }
                //     ],
                //     assertionMethod: [
                //         'did:vda:0x61:0x599b3912A63c98dC774eF3E60282fBdf14cda748#controller',
                //         'did:vda:0x61:0x599b3912A63c98dC774eF3E60282fBdf14cda748?context=0x678904eb5c3f53d8506e7085dfbb0ef333c5f7d0769bcaf4ca2dc0ca46d00001',
                //         'did:vda:0x61:0x599b3912A63c98dC774eF3E60282fBdf14cda748?context=0x67890c45e3ad1ba47c69f266d6c49c589b9d70de837e318c78ff43c7f0b00003'
                //     ],
                //     authentication: [
                //         'did:vda:0x61:0x599b3912A63c98dC774eF3E60282fBdf14cda748#controller',
                //         'did:vda:0x61:0x599b3912A63c98dC774eF3E60282fBdf14cda748?context=0x678904eb5c3f53d8506e7085dfbb0ef333c5f7d0769bcaf4ca2dc0ca46d00001'
                //     ],
                //     service: [
                //         {
                //             id: 'did:vda:0x61:0x599b3912A63c98dC774eF3E60282fBdf14cda748?context=0x84e5fb4eb5c3f53d8506e7085dfbb0ef333c5f7d0769bcaf4ca2dc0ca4698fd4&type=message',
                //             type: 'VeridaMessage',
                //             serviceEndpoint: 'https://db.testnet.verida.io:5002'
                //         },
                //         {
                //             id: 'did:vda:0x61:0x599b3912A63c98dC774eF3E60282fBdf14cda748?context=0xcfbf4621af64386c92c0badd0aa3ae3877a6ea6e298dfa54aa6b1ebe00769b28&type=database',
                //             type: 'VeridaDatabase',
                //             serviceEndpoint: 'https://db.testnet.verida.io:5002'
                //         }
                //     ]
                //   }
            } else {
                /*
                const baseDIDDocument: DocInterface = {
                    '@context': [
                      'https://www.w3.org/ns/did/v1',
                      'https://identity.foundation/EcdsaSecp256k1RecoverySignature2020/lds-ecdsa-secp256k1-recovery2020-0.0.jsonld',
                    ],
                    id: this.did,
                    verificationMethod: [],
                    authentication: [],
                    assertionMethod: [],
                }
                resolve(new DIDDocument(baseDIDDocument))
                */
               reject(resolutionResult.didResolutionMetadata.error)
            }
        })
    }
}