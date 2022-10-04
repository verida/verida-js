import { DIDDocument } from "@verida/did-document"

import { default as VeridaWallet } from "./wallet"
import { VdaDID } from '@verida/vda-did'
import { getResolver } from '@verida/vda-did-resolver'
import { CallType, VeridaMetaTransactionConfig, VeridaSelfTransactionConfig } from '@verida/web3'

import { JsonRpcProvider } from '@ethersproject/providers'

import { Resolver } from 'did-resolver'
import { Signer } from '@ethersproject/abstract-signer';

import { getUpdateListFromDocument} from './helpers'

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

        const vdaDidResolver = getResolver({
            chainId: this.config.network,
            provider,
            rpcUrl: this.config.rpcUrl,
        })
        
        this.didResolver = new Resolver(vdaDidResolver)
    }

    /**
     * Unlock save() function by providing verida signing key.
     * 
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
            const bulkRevokeResult = await this.vdaDid!.bulkRevoke(revokeDelegateList, revokeAttributeList)
        }

        if (addDelegateList.length > 0 || addAttributeList.length > 0) {
            const bulkAddResult = await this.vdaDid!.bulkAdd(addDelegateList, addAttributeList)
        }

        return true
    }

    /**
     * Get original document loaded from blockchain. Creates a new document if it didn't exist
     * 
     * @returns DID Document instance
     */
    public async get(did: string): Promise<DIDDocument> {
        const resolutionResult = await this.didResolver.resolve(did)

        if (resolutionResult.didResolutionMetadata && resolutionResult.didResolutionMetadata.error) {
            throw new Error(`DID resolution error (${resolutionResult.didResolutionMetadata.error}): ${resolutionResult.didResolutionMetadata.message}`)
        }

        if (resolutionResult.didDocument !== null) {
            //console.log('have did doc', resolutionResult.didDocument!)
            // vda-did-resolver always return didDocument if no exception occured while parsing
            return new DIDDocument(resolutionResult.didDocument!)
        } else {
            throw new Error(`DID resolution error (${resolutionResult.didResolutionMetadata.error}): ${resolutionResult.didResolutionMetadata.message}`)
        }
    }
}