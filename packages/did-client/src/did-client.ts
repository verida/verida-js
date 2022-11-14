import { DIDDocument } from "@verida/did-document"

import { default as VeridaWallet } from "./wallet"
import { getResolver, VeridaWeb3ConfigurationOptions, VdaApi } from '@verida/vda-did-resolver'
import { CallType, VeridaMetaTransactionConfig, VeridaSelfTransactionConfig } from '@verida/web3'

import { Resolver } from 'did-resolver'
import { Signer } from '@ethersproject/abstract-signer';

import { getUpdateListFromDocument} from './helpers'

// Part of VeridaSelfTransactionConfig
export interface VeridaSelfTransactionConfigPart  {
    signer?: Signer         // Pre-built transaction signer that is configured to pay for gas
    privateKey?: string     // MATIC private key that will pay for gas
}

/**
 * veridaPrivateKey, callType, web3Config can be provided later by authenticate
 */

export interface DIDClientConfig {
    network: 'testnet' | 'mainnet'              // `testnet` OR `mainnet`
    rpcUrl?: string                              // blockchain RPC URI to use
}

export class DIDClient {

    private config: DIDClientConfig

    // vda-did resolver
    private didResolver: Resolver

    private vdaApi?: VdaApi

    // Verida Wallet Info
    private veridaWallet: VeridaWallet | undefined

    constructor(config: DIDClientConfig) {
        this.config = config

        const resolverConfig: any = {
            name: this.config.network,
        }
        
        if (this.config.rpcUrl) {
            resolverConfig.rpcUrl = this.config.rpcUrl
        }

        const vdaDidResolver = getResolver(resolverConfig)
        this.didResolver = new Resolver(vdaDidResolver)
    }

    /**
     * Unlock save() function by providing verida signing key.
     * 
     * @param veridaPrivateKey Private key of a Verida Account. Used to sign transactions in the DID Registry to verify the request originated from the DID owner / controller
     * @param callType Blockchain interaction mode. 'web3' | 'gasless'
     * @param web3Config Web3 configuration. If `web3`, you must provide `privateKey` (MATIC private key that will pay for gas). If `gasless` you must specify `endpointUrl` (URL of the meta transaction server) and any appropriate `serverConfig` and `postConfig`.
     */
    public authenticate(
        veridaPrivateKey: string,
        callType: CallType,
        web3Config: VeridaSelfTransactionConfigPart | VeridaMetaTransactionConfig
    ) {
        this.veridaWallet = new VeridaWallet(veridaPrivateKey, this.config.network)

        // @ts-ignore
        if (callType == 'gasless' && !web3Config.endpointUrl) {
            throw new Error('Gasless transactions must specify `web3config.endpointUrl`')
        }

        // @ts-ignore
        if (callType == 'web3' && !web3Config.privateKey) {
            throw new Error('Web3 transactions must specify `web3config.privateKey`')
        }

        const _web3Config: VeridaWeb3ConfigurationOptions = callType === 'gasless' ?
            <VeridaMetaTransactionConfig>web3Config :
            <VeridaSelfTransactionConfig>{
                ...<VeridaSelfTransactionConfigPart>web3Config,
                rpcUrl: this.config.rpcUrl
            }

        this.vdaApi = new vdaApi({
            identifier: this.veridaWallet.did,
            vdaKey: this.veridaWallet.privateKey,
            chainNameOrId: this.config.network,
            callType: callType,
            web3Options: _web3Config
        })
    }

    public authenticated(): boolean {
        return this.veridaWallet !== undefined
    }
    
    public getDid(): string | undefined {
        // Add the network into the DID, if not specified
        if (this.veridaWallet === undefined) {
            return undefined
        }
        
        if (this.veridaWallet.did.substring(0,10) == 'did:vda:0x') {
            return this.veridaWallet.did.replace(`did:vda:`, `did:vda:${this.config.network}:`)
        }

        return this.veridaWallet.did
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
    public async save(document: DIDDocument): Promise<boolean> {
        if (this.veridaWallet === undefined) {
            throw new Error("Unable to save DIDDocument. No private key.")
        }

        // Fetch the existing doc. This creates a new, empty doc if not found
        const existingDoc = await this.get(document!.id)
        const comparisonResult = existingDoc.compare(document)

        const {delegateList: revokeDelegateList, attributeList: revokeAttributeList} = getUpdateListFromDocument(comparisonResult.remove)
        const {delegateList: addDelegateList, attributeList: addAttributeList} = getUpdateListFromDocument(comparisonResult.add)

        if (revokeDelegateList.length > 0 || revokeAttributeList.length > 0) {
            await this.vdaDid!.bulkRevoke(revokeDelegateList, revokeAttributeList)
        }

        if (addDelegateList.length > 0 || addAttributeList.length > 0) {
            await this.vdaDid!.bulkAdd(addDelegateList, addAttributeList)
        }

        return true
    }

    /**
     * Get original document loaded from blockchain. Creates a new document if it didn't exist
     * 
     * @returns DID Document instance
     */
    public async get(did: string): Promise<DIDDocument> {
        const resolutionResult = await this.didResolver.resolve(did.toLowerCase())

        if (resolutionResult.didResolutionMetadata && resolutionResult.didResolutionMetadata.error) {
            throw new Error(`DID resolution error (${resolutionResult.didResolutionMetadata.error}): ${resolutionResult.didResolutionMetadata.message} (${did})`)
        }

        if (resolutionResult.didDocument !== null) {
            //console.log('have did doc', resolutionResult.didDocument!)
            // vda-did-resolver always return didDocument if no exception occured while parsing
            return new DIDDocument(resolutionResult.didDocument!)
        } else {
            throw new Error(`DID resolution error (${resolutionResult.didResolutionMetadata.error}): ${resolutionResult.didResolutionMetadata.message} (${did})`)
        }
    }
}