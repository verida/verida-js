import { Client, Network, Context } from '@verida/client-ts';
import { VaultAccount, hasSession } from './index';
import { EventEmitter } from 'events'
import { IProfile, ClientConfig, ContextConfig, MessageSendConfig, IDatastore, IDatabase, DatabaseOpenConfig, DatastoreOpenConfig, AccountVaultConfig } from '@verida/types';

export interface WebUserProfile {
    name?: string
    avatarUri: string
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

/**
 * Usage:
 * 
 * 1. Configure with this.configure(...)
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
    private client?: Client
    private context?: Context
    private account?: VaultAccount
    private profile?: WebUserProfile
    private did?: string

    private connecting?: Promise<boolean>
    private profileConnection?: IProfile

    constructor(config: WebUserConfig) {
        super()
        this.config = config
    }

    public async getClient(): Promise<Client> {
        if (this.client) {
            return this.client
        }

        this.client = new Client(this.config.clientConfig)
        return this.client
    }

    public async getContext(): Promise<Context> {
        await this.requireConnection()
        return this.context!
    }

    public async getAccount(): Promise<VaultAccount> {
        await this.requireConnection()

        return this.account!
    }

    public async getDid(): Promise<string> {
        await this.requireConnection()

        return this.did!
    }

    /**
     * 
     * @param ignoreCache Ignore the cached version of the profile and force refresh a new copy of the profile
     * @returns 
     */
    public async getPublicProfile(ignoreCache: boolean = false): Promise<WebUserProfile> {
        await this.requireConnection()

        if (!ignoreCache && this.profile) {
            // return cached profile
            return this.profile
        }

        // fetch connection to verida profile on the verida network
        if (!this.profileConnection) {
            const connection = await this.context!.getClient().openPublicProfile(this.did!, 'Verida: Vault')
            if (!connection) {
                throw new Error('No profile exists for this account')
            }

            this.profileConnection = connection!

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
     * Connect the user to the Verida Network
     *
     * @emit connected When the user successfully logs in
     * @returns A Promise that will resolve to true / false depending on if the user is connected
     */
    public async connect(): Promise<boolean> {
        if (this.connecting) {
            // Have an existing promise (that may or may not be resolved)
            // Return it so if it's pending, the requestor will wait
            return this.connecting
        }

        // Create a promise that will connect to the network and resolve once complete
        // Also pre-populates the users public profile
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

            this.account = account
            this.context = context!
            this.did = did

            const profile = await this.getPublicProfile()
            this.client = context!.getClient()

            this.emit('connected', profile)
            resolve(true)
        })

        return this.connecting
    }

    public async disconnect(): Promise<void> {
        try {
            const context = await this.getContext()
            await context.disconnect()

            this.context = undefined
            this.account = undefined
            this.profile = undefined
            this.did = undefined
            this.connecting = undefined

            if (this.config.debug) {
                console.log(`Account disconnected`)
            }

            this.emit('disconnected')
        } catch (err: any) {
            if (err.message.match('Not connected')) {
                return
            }

            throw err 
        }
    }

    /**
     * Send a generic message to a user's Verida Wallet
     * 
     * @param {*} did 
     * @param {*} subject 
     * @param {*} message 
     * @param {*} linkUrl 
     * @param {*} linkText 
     */
    public async sendMessage(did: string, message: WebUserMessage): Promise<void> {
        const context = await this.getContext()
        const messaging = await context!.getMessaging()

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
            recipientContextName: "Verida: Vault"
        }

        // Send the message across the network
        await messaging.send(did, messageType, data, message.subject, config)
    }

    /**
     * Is a user connected?
     * 
     * Will auto-connect the user from local storage session if it exists.
     * 
     * @returns 
     */
    public async isConnected(): Promise<boolean> {
        if (this.did) {
            return true
        }

        if (hasSession(this.config.contextConfig.name)) {
            const connected = await this.connect()
            return connected
        }

        return false
    }

    /**
     * Throw an exception if a user isn't connected
     */
    private async requireConnection(): Promise<void> {
        const isConnected = await this.isConnected()
        if (!isConnected) {
            throw new Error('Not connected to Verida network')
        }
    }

    /**
     * Open a datastore owned by this user
     * 
     * @param schemaURL 
     * @param config 
     * @returns 
     */
    public async openDatastore(schemaURL: string, config?: DatastoreOpenConfig): Promise<IDatastore> {
        const context = await this.getContext()
        return await context.openDatastore(schemaURL, config)
    }

    /**
     * Open a database owned by this user
     * 
     * @param databaseName 
     * @param config 
     * @returns 
     */
    public async openDatabase(databaseName: string, config?: DatabaseOpenConfig): Promise<IDatabase> {
        const context = await this.getContext()
        return await context.openDatabase(databaseName, config)
    }


    // @todo
    // public static async requestData() {}
    // public static async sendData() {}
}