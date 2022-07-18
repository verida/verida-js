import Axios from 'axios'
// import { DIDDocument, Interfaces } from "@verida/did-document"
import { DIDDocument } from 'did-resolver'

import Wallet from "./wallet"

// @todo: Link this in package.json
import { VdaDID } from 'vda-did'
import { getResolver, verificationMethodTypes } from 'vda-did-resolver'
import { CallType, VeridaContract, VeridaMetaTransactionConfig } from '@verida/web3'

import { Provider } from '@ethersproject/providers'

import { Resolver, ServiceEndpoint, VerificationMethod } from 'did-resolver'
import { Signer } from 'ethers'

import { DIDDocument as VeridaDocument } from '@verida/did-document'
// import { VeridaMetaTransactionConfig } from '@verida/web3/build/src/config'

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
 * Create instance of DIDClient interface.
 * 
 * @param config : cofiguration for DIDClientImpl class
 * @returns DIDClient 
 */
export async function createDIDClient(config:DIDClientConfig) : Promise<DIDClient> {
    const didClient = new DIDClientImpl(config)

    await didClient.getDocument()

    return didClient
}

class DIDClientImpl implements DIDClient {

    private config: DIDClientConfig
    private identifier: string

    // Verida Wallet Info
    private veridaPrivateKey: Uint8Array
    private veridaWallet: Wallet

    // private did?: string
    
    // Verida Doc
    private didDoc? : DIDDocument


    // vda-did resolver
    private didResolver: Resolver
    private vdaDid: VdaDID

    constructor(config: DIDClientConfig) {
        this.config = config

        this.identifier = config.identifier

        this.veridaWallet = new Wallet(config.veridaPrivateKey)
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

    async generateDIDDocument() {
        const resolutionResult = await this.didResolver.resolve(this.identifier)
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

    // Functions to compare objects
    private deepEqual(object1: any, object2:any) {
        const keys1 = Object.keys(object1);
        const keys2 = Object.keys(object2);
        if (keys1.length !== keys2.length) {
            return false;
        }
        for (const key of keys1) {
            const val1 = object1[key];
            const val2 = object2[key];
            const areObjects = this.isObject(val1) && this.isObject(val2);
            if (
            areObjects && !this.deepEqual(val1, val2) ||
            !areObjects && val1 !== val2
            ) {
            return false;
            }
        }
        return true;
    }

    private isObject(object: any) {
        return object != null && typeof object === 'object';
    }

    private compareKeys(a: Object, b: Object) {
        const aKeys = Object.keys(a).sort()
        const bKeys = Object.keys(b).sort()

        return JSON.stringify(aKeys) === JSON.stringify(bKeys)
    }

    public async saveDocument(document: DIDDocument | undefined): Promise<boolean> {

        // Compare input document & original document and save changes only
        // check ID first
        if (!this.didDoc) 
            throw new Error("No original document")

        if (document === undefined) {
            // To-do: Deactivate doc by set controller to null

        }

        const orgDoc = this.didDoc;

        // Remove common itesm first
        // orgDoc.verificationMethod?.forEach((item, index, arr) => {
        //     const docIndex = document?.verificationMethod?.findIndex(t => this.deepEqual(item, t))
        //     if (docIndex && docIndex !== -1 ) {
        //         // Found same object. Delete on both objects.
        //         arr.splice(index, 1)
        //         document?.verificationMethod?.splice(docIndex, 1)
        //     }
        // })
        const keys = Object.keys(orgDoc);
        keys.forEach(key => {
            if (key in <DIDDocument>document && this.isObject((orgDoc as any)[key])) {
                (orgDoc as any)[key].array.forEach((item : any, index: number, arr: any) => {
                    const docIndex = ((document as any)[key].findIndex((t: any) => this.deepEqual(item, t)))
                    if(docIndex && docIndex !== -1) {
                        arr.splice(index, 1)
                        ((document as any)[key]).splice(docIndex, 1)
                    }
                });
            }
        });

        // Process updated elements from original document
        // To-do implements Verification Methods
        orgDoc?.verificationMethod?.forEach(item => {
            // DIDDelegateChanged for veriKey
            // or Controller
            if ('blockchainAccountId' in item) {
                if (item.id.endsWith('#controller')) {
                    //Controller --> publicKey

                } else {
                    // DIDDelegate Changed --> pks

                }
                // Call revokeDelegate and addDelegate to update
            } else {
                // Meaning AttributeChanged of 'pub' type --> pk
                
                if (orgDoc.authentication?.find(authItem => authItem === item.id)) {
                    // meaning sigAuth attribute
                } else if (orgDoc.keyAgreement?.find(keyrefItem => keyrefItem === item.id)) {
                    // meaning enc attribute
                }

                // call revokeAttribute & setAttribute for updates
            }
        })
        // To-do implemnts Attribute changed - service
        orgDoc?.service?.forEach(serviceItem => {
            // call revokeAttribute & setAttribute for service updates
        })

        // Process nely created elements in update document
        orgDoc?.verificationMethod?.forEach(item => {
            // DIDDelegateChanged for veriKey
            // or Controller
            if ('blockchainAccountId' in item) {
                if (item.id.endsWith('#controller')) {
                    //Controller --> publicKey

                } else {
                    // DIDDelegate Changed --> pks

                }
                // Call addDelegate
            } else {
                // Meaning AttributeChanged of 'pub' type --> pk
                
                if (orgDoc.authentication?.find(authItem => authItem === item.id)) {
                    // meaning sigAuth attribute
                } else if (orgDoc.keyAgreement?.find(keyrefItem => keyrefItem === item.id)) {
                    // meaning enc attribute
                }

                // call setAttribute for updates
            }
        })
        // To-do implemnts Attribute changed - service
        orgDoc?.service?.forEach(serviceItem => {
            // call setAttribute for service updates
        })
        

        return new Promise<boolean>((resolve) => {
            resolve(true)
        })
    }
    public getDocument(): Promise<DIDDocument> {
        return new Promise<DIDDocument>((resolve, reject) => {
            if (!this.didDoc)
                reject("DIDDocument not generated")
            
            resolve(Object.assign({}, this.didDoc!))
        })
    }

    
}

interface DelegateOrController {
    id: string
    type: verificationMethodTypes.EcdsaSecp256k1RecoveryMethod2020
    controllr: string
    blockchainAccountId: string   
}

interface AttributePub {
    id: string
    type: verificationMethodTypes
    controllr: string

    publicKeyBase58?: string
    publicKeyBase64?: string
    publicKeyHex?: string
    publicKeyPem?: string
    value?: string
}