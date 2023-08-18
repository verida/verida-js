import { Client, Network, type Context } from '@verida/client-ts';
import { VaultAccount, hasSession } from '@verida/account-web-vault';
import { EventEmitter } from 'events'
import type { IProfile, ClientConfig, ContextConfig, MessageSendConfig, DatabaseOpenConfig, DatastoreOpenConfig, AccountVaultConfig } from '@verida/types';

export interface WebUserProfile {
    name?: string
    avatarUri?: string
    country?: string
    description?: string
}

export interface WebUserConfig {
    clientConfig: ClientConfig,
    accountConfig: AccountVaultConfig,
    contextConfig: ContextConfig,
    debug?: boolean
}

export interface WebUserMessage {
    subject: string
    text: string
    link?: WebUserMessageLink
}

export interface WebUserMessageLink {
    url: string
    text: string
}

// TODO: To move to a single constants in the SDK
const VAULT_CONTEXT_NAME = "Verida: Vault"

/**
 * Usage:
 *
 * 1. Create a new instance of this class with the required configuration.
 * 2. Check if the user is logged in with this.isConnected()
 * 3. Log the user in with this.connect()
 * 4. Listen to when the user has logged in with this.on('connected')
 * 5. Listen to when the user updates their profile with this.on('profileUpdated')
 * 5. Listen to when the user logs out with this.on('disconnected')
 *
 * @event profileChanged
 * @event connect
 * @event disconnected
 */
export class WebUser extends EventEmitter {

    private config: WebUserConfig
    private client: Client
    private context?: Context
    private account?: VaultAccount
    private did?: string
    private profile?: WebUserProfile
    private profileConnection?: IProfile
    private connecting?: Promise<boolean>

    constructor(config: WebUserConfig) {
        super()
        this.config = config
        this.client = new Client(config.clientConfig)
    }

    /**
     * Check if the user is connected.
     *
     * Connected means the 'context', the 'account' and the 'did' are defined.
     *
     * @returns 'true' if connected, 'false' otherwise.
     */
    public isConnected() {
        return !!this.context && !!this.account && !!this.did
    }

    /**
     * Check a user is connected, throw an error if not.
     *
     * @throws An error if the user isn't connected.
     */
    private requireConnection() {
        if (!this.isConnected()) {
            throw new Error('Not connected to Verida Network')
        }
    }

    /**
     * Get the instance of the Verida Client.
     *
     * @returns The Verida Client instance.
     */
    public getClient() {
        return this.client
    }

    /**
     * Get the Verida Context for this Application.
     *
     * @throws An error if the user isn't connected.
     * @returns The Verida Context instance.
     */
    public getContext() {
        this.requireConnection()
        return this.context! // We know it's not undefined
    }

    /**
     * Get the Verida Account for this user.
     *
     * @throws An error if the user isn't connected.
     * @returns The Verida Account instance.
     */
    public getAccount() {
        this.requireConnection()
        return this.account! // We know it's not undefined
    }

    /**
     * Get the DID of the connected user.
     *
     * @throws An error if the user isn't connected.
     * @returns The user's DID.
     */
    public getDid() {
        this.requireConnection()
        return this.did! // We know it's not undefined
    }

    /**
     * Fetch the public profile from the user's Vault.
     *
     * @param ignoreCache Ignore the cached version of the profile and force refresh a new copy of the profile.
     * @returns A Promise that will resolve to the user's public profile.
     */
    public async getPublicProfile(ignoreCache = false) {
        this.requireConnection()

        if (!ignoreCache && this.profile) {
            // return cached profile
            return this.profile
        }

        // fetch connection to verida profile on the verida network
        if (!this.profileConnection) {
            const connection = await this.context!.getClient().openPublicProfile(this.did!, VAULT_CONTEXT_NAME)
            if (!connection) {
                throw new Error('No profile exists for this account')
            }

            this.profileConnection = connection

            // bind an event listener to find changes
            this.profileConnection.listen(async () => {
                const profile = await this.getPublicProfile(true)
                this.emit('profileChanged', profile)
            })

            this.profileConnection
        }

        const profile = this.profileConnection

        // load avatar
        const avatar = await profile.get('avatar')

        // build a cached profile
        this.profile = {
            avatarUri: avatar ? avatar.uri : undefined,
            name: await profile.get('name'),
            country: await profile.get('country'),
            description: await profile.get('description'),
        }

        return this.profile
    }

    /**
     * Connect the user if a session already exists locally. It won't prompt the user to login.
     *
     * @returns A promise resolving to 'true' if the user is now connected, 'false' otherwise.
     */
    public async autoConnectExistingSession() {
        if (hasSession(this.config.contextConfig.name)) {
            return this.connect()
        }
        return this.isConnected();
    }

    /**
     * Connect the user to the Verida Network.
     *
     * @emit connected When the user successfully logs in
     * @returns A Promise that will resolve to true / false depending on if the user is connected
     */
    public async connect() {
        if (this.connecting) {
            // Have an existing promise (that may or may not be resolved)
            // Return it so if it's pending, the requestor will wait
            return this.connecting
        }

        // Create a promise that will connect to the network and resolve once complete
        // Also pre-populates the user's public profile
        const config = this.config
        this.connecting = new Promise(async (resolve, reject) => {
            const account = new VaultAccount(config.accountConfig);

            const context = await Network.connect({
                client: config.clientConfig,
                account,
                context: config.contextConfig
            });

            if (!context) {
                if (config.debug) {
                    console.log('User cancelled login attempt by closing the QR code modal or an unexpected error occurred');
                }

                resolve(false)
                return
            }

            const did = await account.did()
            if (config.debug) {
                console.log(`Account connected with did: ${did}`)
            }

            const profile = await this.getPublicProfile()

            this.account = account
            this.context = context
            this.did = did
            this.client = context.getClient()

            this.emit('connected', profile)
            resolve(true)
        })

        return this.connecting
    }

    /**
     * Disconnect the user from the Verida Network.
     *
     * @emit disconnected When the user is successfully logged out.
     */
    public async disconnect() {
        try {
            const context = this.getContext()
            await context.disconnect()

            this.context = undefined
            this.account = undefined
            this.did = undefined
            this.profile = undefined
            this.profileConnection = undefined
            this.connecting = undefined

            if (this.config.debug) {
                console.log(`Account disconnected`)
            }

            this.emit('disconnected')
        } catch (error: unknown) {
            if (error instanceof Error && error.message.match('Not connected')) {
                return
            }
            throw error
        }
    }

    /**
     * Send a generic message to a user's inbox (accessible from the Verida Wallet).
     *
     * @param {string} did
     * @param {WebUserMessage} message the message definition
     */
    public async sendMessage(did: string, message: WebUserMessage) {
        const context = this.getContext()
        const messaging = await context.getMessaging()

        const data = {
            data: [{
                subject: message.subject,
                message: message.text,
                link: message.link ? message.link : undefined
            }]
        }

        const messageType = "inbox/type/message"
        const config: MessageSendConfig = {
            did,
            recipientContextName: VAULT_CONTEXT_NAME
        }

        // Send the message across the Network
        return messaging.send(did, messageType, data, message.subject, config)
    }

    /**
     * Open a datastore owned by this user.
     *
     * @param {string} schemaURL
     * @param {DatastoreOpenConfig} config
     * @returns A Promise that will resolve to the datastore instance.
     */
    public openDatastore(schemaURL: string, config?: DatastoreOpenConfig) {
        const context = this.getContext()
        return context.openDatastore(schemaURL, config)
    }

    /**
     * Open a database owned by this user.
     *
     * @param {string} databaseName
     * @param {DatabaseOpenConfig} config
     * @returns A Promise that will resolve to the database instance.
     */
    public openDatabase(databaseName: string, config?: DatabaseOpenConfig) {
        const context = this.getContext()
        return context.openDatabase(databaseName, config)
    }


    // @todo
    // public static async requestData() {}
    // public static async sendData() {}
}
