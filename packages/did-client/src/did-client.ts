import Axios from 'axios'
// import { DIDDocument, Interfaces } from "@verida/did-document"
import { DIDDocument } from 'did-resolver'

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
        const resolutionResult = await this.didResolver.resolve(this.vdaDid.did)
        if (resolutionResult.didDocument !== null) {
            this.didDoc = <DIDDocument>resolutionResult.didDocument
        }
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
        return new Promise<boolean>((resolve, reject) => {
            // check ID first
            if (!this.didDoc) 
                reject("No original document")

            if (document === undefined) {
                // To-do: Deactivate doc by set controller to null
                reject("Empty document")
            }

            const orgDoc = this.didDoc;

            // Compare input document & original document and save changes only
            removeCommonItems(orgDoc!, document!)

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
        })
    }

    /**
     * 
     * @returns Get original document loaded from blockchain
     */
    public getDocument(): Promise<DIDDocument> {
        return new Promise<DIDDocument>((resolve, reject) => {
            if (!this.didDoc)
                reject("DIDDocument not generated")
            
            resolve(Object.assign({}, this.didDoc!))
        })
    }
}