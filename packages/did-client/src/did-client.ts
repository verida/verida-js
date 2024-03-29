import { DIDDocument as VeridaDIDDocument } from "@verida/did-document"

import { default as VeridaWallet } from "./wallet"
import { getResolver } from '@verida/vda-did-resolver'
import { RPC_URLS, getWeb3ConfigDefaults } from "@verida/vda-common"
import { VdaDid } from '@verida/vda-did'
import { Resolver } from 'did-resolver'
import { Web3CallType, DIDClientConfig, VdaDidEndpointResponses, Web3ResolverConfigurationOptions, Web3SelfTransactionConfig, Web3MetaTransactionConfig, VeridaWeb3ConfigurationOptions, Web3SelfTransactionConfigPart, IDIDClient, VeridaDocInterface } from "@verida/types"

export class DIDClient implements IDIDClient {

    private config: DIDClientConfig

    // vda-did resolver
    private didResolver: Resolver

    private vdaDid?: VdaDid

    // Verida Wallet Info
    private veridaWallet: VeridaWallet | undefined

    private defaultEndpoints?: string[]

    private endpointErrors?: VdaDidEndpointResponses

    constructor(config: DIDClientConfig) {
        this.config = config

        const resolverConfig: Web3ResolverConfigurationOptions = {
            timeout: config.timeout ? config.timeout : 10000
        }
        
        resolverConfig.rpcUrl = this.getRpcUrl()

        const vdaDidResolver = getResolver(resolverConfig)
        // @ts-ignore
        this.didResolver = new Resolver(vdaDidResolver)
    }

    public getRpcUrl(): string {
        const rpcUrl = this.config.rpcUrl ? this.config.rpcUrl : RPC_URLS[this.config.network]
        if (!rpcUrl) {
            throw new Error(`Unable to locate RPC_URL for network (${this.config.network})`)
        }

        return rpcUrl
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
        callType: Web3CallType,
        web3Config: Web3SelfTransactionConfigPart | Web3MetaTransactionConfig,
        defaultEndpoints: string[]
    ) {
        this.defaultEndpoints = defaultEndpoints

        this.veridaWallet = new VeridaWallet(veridaPrivateKey, this.config.network)

        // @ts-ignore
        if (callType == 'gasless' && !web3Config.endpointUrl) {
            throw new Error('Gasless transactions must specify `web3config.endpointUrl`')
        }

        // @ts-ignore
        if (callType == 'web3' && !web3Config.privateKey) {
            throw new Error('Web3 transactions must specify `web3config.privateKey`')
        }

        web3Config = {
            ...getWeb3ConfigDefaults(this.config.network),
            ...web3Config
        }

        // @ts-ignore
        let rpcUrl = web3Config.rpcUrl || this.config.rpcUrl
        if (callType == 'web3' && !rpcUrl) {
            throw new Error('Web3 transactions must specify `web3config.rpcUrl`')
        }

        const _web3Config: VeridaWeb3ConfigurationOptions = callType === 'gasless' ?
            <Web3MetaTransactionConfig>web3Config :
            <Web3SelfTransactionConfig>{
                ...<Web3SelfTransactionConfigPart>web3Config,
                rpcUrl
            }

        this.vdaDid = new VdaDid({
            identifier: this.veridaWallet.did,
            signKey: this.veridaWallet.privateKey,
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
     * Destroy this DID
     * 
     * Note: This can not be reversed and is written to the blockchain
     */
    public async destroy(): Promise<VdaDidEndpointResponses> {
        if (!this.authenticated()) {
            throw new Error("Unable to save DIDDocument. No private key.")
        }

        return await this.vdaDid!.delete()
    }

    /**
     * Save DIDDocument to the chain
     * 
     * @param document Updated DIDDocuent
     * @returns true if success.
     */
    public async save(document: VeridaDIDDocument): Promise<VdaDidEndpointResponses> {
        if (!this.authenticated()) {
            throw new Error("Unable to save DIDDocument. No private key.")
        }

        // Fetch the existing doc. This creates a new, empty doc if not found
        let existingDoc
        try {
            existingDoc = await this.get(document!.id)
        } catch (err: any) {
            if (!err.message.match('DID resolution error')) {
                throw err
            }
        }

        let endpointResponse
        if (!existingDoc) {
            // Need to create the DID Doc
            if (!this.defaultEndpoints || this.defaultEndpoints.length === 0) {
                throw new Error('Default DID Document endpoints not specified')
            }

            const endpoints = this.defaultEndpoints!.map(item => {
                return `${item}${document.id}`
            })

            try {
                endpointResponse = await this.vdaDid!.create(document, endpoints)
            } catch (err: any) {
                if (err.message == 'Unable to create DID: All endpoints failed to accept the DID Document') {
                    this.endpointErrors = this.vdaDid!.getLastEndpointErrors()
                }

                throw err
            }
        } else {
            // Doc exists, need to update
            const doc = document.export()

            document.setAttributes({
                // Set updated timestamp
                updated: document.buildTimestamp(new Date()),
                // Increment version number
                versionId: doc.versionId + 1
            })

            try {
                endpointResponse = await this.vdaDid!.update(document)
            } catch (err: any) {
                if (err.message == 'Unable to update DID: All endpoints failed to accept the DID Document') {
                    this.endpointErrors = this.vdaDid!.getLastEndpointErrors()
                }

                throw err
            }
        }

        return endpointResponse
    }

    public getLastEndpointErrors(): VdaDidEndpointResponses {
        return this.endpointErrors ? this.endpointErrors : <VdaDidEndpointResponses> {}
    }

    /**
     * Get original document loaded from blockchain. Creates a new document if it didn't exist
     * 
     * @returns DID Document instance
     */
    public async get(did: string): Promise<VeridaDIDDocument> {
        const resolutionResult = await this.didResolver.resolve(did.toLowerCase())

        if (resolutionResult.didResolutionMetadata && resolutionResult.didResolutionMetadata.error) {
            throw new Error(`DID resolution error (${resolutionResult.didResolutionMetadata.error}): ${resolutionResult.didResolutionMetadata.message} (${did})`)
        }

        return new VeridaDIDDocument(<VeridaDocInterface> resolutionResult.didDocument)
    }
}