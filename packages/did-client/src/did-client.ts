import Axios from 'axios'
// import { DIDDocument, Interfaces } from "@verida/did-document"
import { DIDDocument } from 'did-resolver'
const deepcopy = require('deepcopy')

import { default as VeridaWallet } from "./wallet"
import { Wallet } from '@ethersproject/wallet'

// @todo: Link this in package.json
import { VdaDID, BulkDelegateParam, BulkAttributeParam, DelegateTypes } from '@verida/vda-did'
import { getResolver, verificationMethodTypes, interpretIdentifier } from '@verida/vda-did-resolver'
import { CallType, VeridaContract, VeridaMetaTransactionConfig } from '@verida/web3'

import { Provider } from '@ethersproject/providers'

import { Resolver, ServiceEndpoint, VerificationMethod } from 'did-resolver'
import { Signer } from 'ethers'

import { DIDDocument as VeridaDocument } from '@verida/did-document'
// import { VeridaMetaTransactionConfig } from '@verida/web3/build/src/config'

import {isObject, removeCommonItems, getUpdateListFromDocument} from './helpers'

const CONTRACT_ADDRESSES: any = {
    'testnet': '0x2862BC860f55D389bFBd1A37477651bc1642A20B'
}

const didRegistryABI = require('./VDADIDRegistry.abi.json')

// Part of VeridaSelfTransactionConfig
interface VeridaSelfTransactionConfigPart  {
    signer?: Signer
    privateKey?: string
}

export interface DIDClientConfig {
    // For signing doc
    veridaPrivateKey: string

    // vda-did resolver - only
    identifier : string // DID
    chainName? : string 
    chainId? : string | number

    // common to vda-did resolver & vda-did self transaction config
    provider? : Provider
    rpcUrl? : string
    registry?: string
    web3?: any

    // vda-did
    callType: CallType

    // self or meta transaction configuration
    web3Config: VeridaSelfTransactionConfigPart|VeridaMetaTransactionConfig
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

    authenticate(privateKey: string): void;

    getDid(): string | undefined;

    getPublicKey(): string;

    saveDocument(document: DIDDocument): Promise<boolean>;

    getDocument(): Promise<DIDDocument | null>
    
}

/**
 * Create instance of DIDClient interface. And load DIDDocument from chain
 *  * 
 * @param config : cofiguration for DIDClientImpl class
 * @returns DIDClient 
 */
export async function createDIDClient(config:DIDClientConfig) : Promise<DIDClient> {
    const didClient = new DIDClientImpl(config)

    await didClient.loadDIDDocument()

    return didClient
}

class DIDClientImpl implements DIDClient {

    private config: DIDClientConfig
    private identifier: string

    // Verida Wallet Info
    private veridaPrivateKey: Uint8Array
    private veridaWallet: VeridaWallet

    // private did?: string
    
    // Verida Doc
    private didDoc? : DIDDocument


    // vda-did resolver
    private didResolver: Resolver
    private vdaDid: VdaDID

    constructor(config: DIDClientConfig) {
        this.config = config

        this.identifier = config.identifier

        this.veridaWallet = new VeridaWallet(config.veridaPrivateKey)
        this.veridaPrivateKey = this.veridaWallet.privateKeyBuffer

        const vdaDidResolver = getResolver({
            name: config.chainName,
            provider: config.provider,
            rpcUrl: config.rpcUrl,
            registry: config.registry,
            chainId: config.chainId,
            web3: config.web3
        })
        
        this.didResolver = new Resolver(vdaDidResolver)

        const web3Config = config.callType === 'gasless' ?
            <VeridaMetaTransactionConfig>config.web3Config :
            <VeridaSelfTransactionConfigPart>{
                ...<VeridaSelfTransactionConfigPart>config.web3Config,
                provider: config.provider,
                rpcUrl: config.rpcUrl,
                web3: config.web3
            }

        this.vdaDid = new VdaDID({
            identifier: config.identifier,
            chainNameOrId: config.chainName || config.chainId,
            callType: config.callType,
            web3Options: web3Config
        })
    }

    /**
     * Load DIDDocument from chain. Should be called after DIDClientImpl created
     */
    async loadDIDDocument() {
        // Real code
        const resolutionResult = await this.didResolver.resolve(this.vdaDid.did)
        if (resolutionResult.didDocument !== null) {
            this.didDoc = <DIDDocument>resolutionResult.didDocument
        }

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
    }

    public authenticate(privateKey: string) {
        throw new Error('Method not implemented.')
    }
    
    public getDid(): string | undefined {
        return this.vdaDid.did
    }
    
    public getPublicKey(): string {
        return this.veridaWallet.publicKey
    }

    /**
     * Save DIDDocument to the chain
     * 
     * @param document Updated DIDDocuent
     * @returns true if success.
     */
    public async saveDocument(document: DIDDocument | undefined): Promise<boolean> {
        if (!this.didDoc) {
            return Promise.reject("No original document")
        }

        if (document === undefined) {
            return Promise.reject("Empty document")
        }

        const orgDoc = this.didDoc;

        // Compare input document & original document and save changes only
        removeCommonItems(orgDoc!, document!)

        // // TestCode
        const {delegateList: addDelegateList, attributeList: addAttributeList} = getUpdateListFromDocument(document!)
        const {delegateList: revokeDelegateList, attributeList: revokeAttributeList} = getUpdateListFromDocument(orgDoc!)

        console.log('RevokeList', revokeDelegateList, revokeAttributeList)
        console.log('AddList', addDelegateList, addAttributeList)

        if (revokeDelegateList.length > 0 || revokeAttributeList.length > 0) {
            console.log('Revoke deleted items', revokeDelegateList, revokeAttributeList)
            await this.vdaDid.bulkRevoke(revokeDelegateList, revokeAttributeList)
        }

        if (addDelegateList.length > 0 || addAttributeList.length > 0) {
            console.log('Add new items', addDelegateList, addAttributeList)
            await this.vdaDid.bulkAdd(addDelegateList, addAttributeList)
        }

        console.log('saveDocument - returning result')
        return Promise.resolve(true)

        /*
        // Revoke deleted items in original document
        const {delegateList: revokeDelegateList, attributeList: revokeAttributeList} = getUpdateListFromDocument(orgDoc!)
        this.vdaDid.bulkRevoke(revokeDelegateList, revokeAttributeList)
        .then(() => {
            // Add new items in updated document
            const {delegateList: addDelegateList, attributeList: addAttributeList} = getUpdateListFromDocument(document!)

            this.vdaDid.bulkAdd(addDelegateList, addAttributeList).then(() => resolve(true))
            .catch(() => reject('Failed to add new updates'))
        })
        .catch(() => reject('Failed to revoke deleted items'))

        // Promise.all([this.vdaDid.bulkRevoke(revokeDelegateList, revokeAttributeList), 
        // this.vdaDid.bulkAdd(addDelegateList, addAttributeList)])
        // .then(() => resolve(true))
        // .catch(() => reject(false))
        */
    }

    public async reloadDIDDocument() {
        const resolutionResult = await this.didResolver.resolve(this.vdaDid.did)
        if (resolutionResult.didDocument !== null) {
            this.didDoc = <DIDDocument>resolutionResult.didDocument
        }
        return this.didDoc
    }

    /**
     * 
     * @returns Get original document loaded from blockchain
     */
    public getDocument(): Promise<DIDDocument> {
        return new Promise<DIDDocument>((resolve, reject) => {
            if (!this.didDoc)
                this.loadDIDDocument().then(() => {
                    resolve(deepcopy(this.didDoc!))
                }).catch(() => {
                    reject("DIDDocument not generated")
                })
                
            resolve(deepcopy(this.didDoc!))
        })
    }
}