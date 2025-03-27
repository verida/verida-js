import { StorageLink, DIDStorageConfig } from '@verida/storage-link'
import { Keyring } from '@verida/keyring'
import { Account } from '@verida/account'

import { DIDClient, VeridaDidWallet } from '@verida/did-client'
import VeridaDatabaseAuthType from "./authTypes/VeridaDatabase"
import { AccountConfig, AuthContext, SecureContextConfig, SecureContextEndpointType, SecureContextServices, SignerAccountConfig, VdaDidEndpointResponses, VeridaDatabaseAuthTypeConfig } from '@verida/types'
import { NodeSelector, NodeSelectorConfig, NodeSelectorParams } from './nodeSelector'
import { ServiceEndpoint } from 'did-resolver'
import { DefaultNetworkBlockchainAnchors } from '@verida/vda-common'
import { buildContextConsentMessage } from './utils'

export class SignerAccount extends Account {
    private didClient: DIDClient
    private veridaDidWallet: VeridaDidWallet
    protected accountConfig?: AccountConfig
    protected config: SignerAccountConfig
    protected contextAuths: Record<string, Record<string, VeridaDatabaseAuthType>> = {}
    protected defaultNodes: string[] = []

    constructor(config: SignerAccountConfig, veridaDidWallet: VeridaDidWallet, accountConfig?: AccountConfig) {
        super()
        this.accountConfig = accountConfig
        this.config = config

        this.veridaDidWallet = veridaDidWallet

        this.didClient = new DIDClient({
            ...config.didClientConfig,
            network: config.network
        })
    }

    public static async create(config: SignerAccountConfig, accountConfig?: AccountConfig): Promise<SignerAccount> {
        const blockchain = DefaultNetworkBlockchainAnchors[config.network]
        const veridaDidWallet = await VeridaDidWallet.fromSigner(config.signer, blockchain)

        return new SignerAccount(config, veridaDidWallet, accountConfig)
    }

    public getDIDClient(): DIDClient {
        return this.didClient
    }

    public setAccountConfig(accountConfig: AccountConfig) {
        this.accountConfig = accountConfig
    }

    public getAccountConfig(): AccountConfig | undefined {
        return this.accountConfig
    }

    public getConfig(): SignerAccountConfig {
        return this.config
    }

    public async keyring(contextName: string): Promise<Keyring> {
        const did = await this.did()
        const consentMessage = buildContextConsentMessage(did, contextName)
        const signature = await this.sign(consentMessage)
        return new Keyring(signature)
    }

    public async sign(message: string): Promise<string> {
        return this.veridaDidWallet.signer.signMessage(message)
        // return EncryptionUtils.signData(message, this.wallet.privateKeyBuffer)
    }

    public async did(): Promise<string> {
        return this.veridaDidWallet.did
    }

    public async loadDefaultStorageNodes(countryCode?: string, numNodes: number = 3, config: NodeSelectorParams = {}): Promise<void> {
        const nodeUris = await this.getDefaultNodes(countryCode, numNodes, config)

        this.accountConfig = {
            defaultDatabaseServer: {
                type: 'VeridaDatabase',
                endpointUri: nodeUris
            },
            defaultMessageServer:  {
                type: 'VeridaMessage',
                endpointUri: nodeUris
            },
            defaultNotificationServer:  {
                type: 'VeridaNotification',
                endpointUri: config.notificationEndpoints! ? config.notificationEndpoints! : []
            }
        }
    }

    private async getDefaultNodes(countryCode?: string, numNodes: number = 3, config: NodeSelectorParams = {}): Promise<ServiceEndpoint[]> {
        if (this.defaultNodes && this.defaultNodes.length) {
            return this.defaultNodes
        }

        config.network = this.config.network
        config.defaultTimeout = config.defaultTimeout ? config.defaultTimeout : 5000
        config.notificationEndpoints = config.notificationEndpoints ? config.notificationEndpoints : []

        const nodeSelector = new NodeSelector(<NodeSelectorConfig> config)
        const nodeUris = await nodeSelector.selectEndpointUris(countryCode, numNodes)
        this.defaultNodes = nodeUris

        return this.defaultNodes
    }

    public async storageConfig(contextName: string, forceCreate?: boolean): Promise<SecureContextConfig | undefined> {
        await this.ensureAuthenticated()

        let did = await this.did()
        let storageConfig = await StorageLink.getLink(this.config.network, this.didClient, did, contextName, true)

        if (storageConfig && storageConfig.isLegacyDid) {
            this.veridaDidWallet.did = this.veridaDidWallet.did.replace('polpos', 'mainnet')
            did = this.veridaDidWallet.did
        }

        // Create the storage config if it doesn't exist and force create is specified
        if (!storageConfig && forceCreate) {
            if (!this.accountConfig) {
                await this.loadDefaultStorageNodes(this.config.countryCode)
            }

            const endpoints: SecureContextServices = {
                databaseServer: this.accountConfig!.defaultDatabaseServer,
                messageServer: this.accountConfig!.defaultMessageServer
            }

            if (this.accountConfig!.defaultStorageServer) {
                endpoints.storageServer = this.accountConfig!.defaultStorageServer
            }

            if (this.accountConfig!.defaultNotificationServer) {
                endpoints.notificationServer = this.accountConfig!.defaultNotificationServer
            }

            storageConfig = await DIDStorageConfig.generate(this, contextName, endpoints)

            // Need to determine if this is a legacy DID
            try {
                const didDocument = await this.didClient.get(did)
                storageConfig.isLegacyDid = didDocument.id.match('mainnet') ? true : false

                if (storageConfig.isLegacyDid) {
                    this.veridaDidWallet.did = this.veridaDidWallet.did.replace('polpos', 'mainnet')
                }
            }  catch (err: any) {
                // DID may not exist, which means it's not a legacy DID, so no action required
                if (!err.message.match('notFound')) {
                    // Unknown error, so rethrow
                    throw err
                }
            }

            await this.linkStorage(storageConfig)
        }

        return storageConfig
    }

    /**
     * Link storage to this user
     *
     * @param storageConfig
     */
     public async linkStorage(storageConfig: SecureContextConfig): Promise<boolean> {
        await this.ensureAuthenticated()
        const keyring = await this.keyring(storageConfig.id)
        const result = await StorageLink.setLink(this.config.network, this.didClient, storageConfig, keyring, this.veridaDidWallet.signer)

        for (let i in result) {
            const response = result[i]
            if (response.status !== 'success') {
                return false
            }
        }

        return true
     }

     /**
      * Unlink storage for this user
      *
      * @param contextName
      */
    public async unlinkStorage(contextName: string): Promise<boolean> {
        await this.ensureAuthenticated()
        let result = await StorageLink.unlink(this.config.network, this.didClient, contextName)
        if (!result) {
            return false
        }

        result = <VdaDidEndpointResponses> result
        for (let i in result) {
            const response = result[i]
            if (response.status !== 'success') {
                return false
            }
        }

        return true
    }

    /**
     * Link storage context service endpoint
     *
     */
    public async linkStorageContextService(contextName: string, endpointType: SecureContextEndpointType, serverType: string, endpointUris: string[]): Promise<boolean> {
        await this.ensureAuthenticated()
        const result = await StorageLink.setContextService(this.config.network, this.didClient, contextName, endpointType, serverType, endpointUris)

        for (let i in result) {
            const response = result[i]
            if (response.status !== 'success') {
                return false
            }
        }

        return true
    }

    public async getAuthContext(contextName: string, contextConfig: SecureContextConfig, authConfig: VeridaDatabaseAuthTypeConfig, authType: string = "database"): Promise<AuthContext> {
        if (typeof(authConfig.force) == 'undefined') {
            authConfig.force = false
        }

        if (typeof(authConfig.endpointUri) == 'undefined') {
            throw new Error('Endpoint must be specified when getting auth context')
        }

        const endpointUri = authConfig.endpointUri

        // Use existing context auth instance if it exists
        if (this.contextAuths[contextName] && this.contextAuths[contextName][endpointUri]  && !authConfig.force && !authConfig.invalidAccessToken) {
            return this.contextAuths[contextName][endpointUri].getAuthContext()
        }

        const signKey = contextConfig.publicKeys.signKey

        // @todo: Currently hard code database server, need to support other service types in the future
        const serviceEndpoint = contextConfig.services.databaseServer

        if (serviceEndpoint.type == "VeridaDatabase") {
            if (!this.contextAuths[contextName]) {
                this.contextAuths[contextName] = {}
            }

            const authType = new VeridaDatabaseAuthType(this, contextName, endpointUri, signKey)
            this.contextAuths[contextName][endpointUri] = authType

            return authType.getAuthContext(authConfig)
        }

        throw new Error(`Unknown auth context type (${authType})`)
    }

    public async disconnectDevice(contextName: string, deviceId: string="Test device"): Promise<boolean> {
        if (!this.contextAuths[contextName]) {
            throw new Error(`Context not connected ${contextName}`)
        }

        let success = true
        const contextAuths = this.contextAuths[contextName]
        for (let i in contextAuths) {
            if (!(await contextAuths[i].disconnectDevice(deviceId))) {
                success = false
            }
        }

        return success
    }

    public async ensureAuthenticated() {
        if (this.didClient.authenticated()) {
            return
        }

        if (!this.config.didClientConfig.didEndpoints) {
            const nodeUris = await this.getDefaultNodes(this.config.countryCode)
            this.config.didClientConfig.didEndpoints = nodeUris.map((item) => `${item}did/`)
        }

        await this.didClient.authenticate(
            this.veridaDidWallet.signer,
            this.config.didClientConfig.callType,
            this.config.didClientConfig.web3Config,
            this.config.didClientConfig.didEndpoints!
        )
    }
}
