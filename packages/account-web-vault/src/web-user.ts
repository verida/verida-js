import { Client, Network, Context } from '@verida/client-ts';
import { VaultAccount, hasSession } from './index';
import { EventEmitter } from 'events'
import { IProfile, ClientConfig, ContextConfig, NetworkConnectionConfig, MessageSendConfig, IDatastore, IDatabase, DatabaseOpenConfig, DatastoreOpenConfig, AccountVaultConfig } from '@verida/types';

const VeridaEvents = new EventEmitter()

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
 * 1. Configure with WebUser.configure(...)
 * 2. Check if the user is logged in with WebUser.isConnected()
 * 3. Log the user in with WebUser.connect()
 * 4. Listen to when the user has logged in with WebUser.on('connected')
 * 5. Listen to when the user updates their profile with WebUser.on('profileUpdated')
 * 5. Listen to when the user logs out with WebUser.on('disconnected')
 * 
 * @event profileChanged
 * @event connected
 * @event disconnected
 */
export class WebUser {

    private static config: WebUserConfig
    private static client?: Client
    private static context?: Context
    private static account?: VaultAccount
    private static profile?: WebUserProfile
    private static did?: string

    private static connecting: Promise<boolean>
    private static profileConnection: IProfile

    public static configure(config: WebUserConfig): void {
        WebUser.config = config
    }

    public static async getClient(): Promise<Client> {
        if (WebUser.client) {
            return WebUser.client
        }

        WebUser.client = new Client(WebUser.config.clientConfig)
        return WebUser.client
    }

    public static async getContext(): Promise<Context> {
        await WebUser.requireConnection()
        return WebUser.context!
    }

    public static async getAccount(): Promise<VaultAccount> {
        await WebUser.requireConnection()

        return WebUser.account!
    }

    public static async getDid(): Promise<string> {
        await WebUser.requireConnection()

        return WebUser.did!
    }

    /**
     * 
     * @param ignoreCache Ignore the cached version of the profile and force refresh a new copy of the profile
     * @returns 
     */
    public static async getPublicProfile(ignoreCache: boolean = false): Promise<WebUserProfile> {
        await WebUser.requireConnection()

        if (!ignoreCache && WebUser.profile) {
            // return cached profile
            return WebUser.profile
        }

        // fetch connection to verida profile on the verida network
        if (!WebUser.profileConnection) {
            const connection = await WebUser.context!.getClient().openPublicProfile(WebUser.did!, 'Verida: Vault')
            if (!connection) {
                throw new Error('No profile exists for this account')
            }

            WebUser.profileConnection = connection!

            // bind an event listener to find changes
            WebUser.profileConnection.listen(async () => {
                const profile = await WebUser.getPublicProfile(true)
                VeridaEvents.emit('profileChanged', profile)
            })

            WebUser.profileConnection
        }

        const profile = WebUser.profileConnection

        // load avatar
        const avatar = await profile.get('avatar')

        // build a cached profile
        WebUser.profile = {
            avatarUri: avatar ? avatar.uri : undefined,
            name: await profile.get('name'),
            country: await profile.get('country'),
            description: await profile.get('description'),
        }

        return WebUser.profile
    }

    /**
     * Connect the user to the Verida Network
     *
     * @emit connected When the user successfully logs in
     * @returns A Promise that will resolve to true / false depending on if the user is connected
     */
    public static async connect(): Promise<boolean> {
        if (WebUser.connecting) {
            // Have an existing promise (that may or may not be resolved)
            // Return it so if it's pending, the requestor will wait
            return WebUser.connecting
        }

        if (!WebUser.config) {
            throw new Error('WebUser is not configured')
        }

        // Create a promise that will connect to the network and resolve once complete
        // Also pre-populates the users public profile
        WebUser.connecting = new Promise(async (resolve, reject) => {
            const account = new VaultAccount(WebUser.config.accountConfig);

            const context = await Network.connect({
                client: WebUser.config.clientConfig,
                account,
                context: WebUser.config.contextConfig
            });

            if (!context) {
                if (WebUser.config.debug) {
                    console.log('User cancelled login attempt by closing the QR code modal or an unexpected error occurred');
                }

                resolve(false)
            }

            const did = await account.did()
            if (WebUser.config.debug) {
                console.log(`Account connected with did: ${did}`)
            }

            WebUser.account = account
            WebUser.context = context!
            WebUser.did = did

            const profile = await WebUser.getPublicProfile()
            WebUser.client = context!.getClient()

            VeridaEvents.emit('connected', profile)
            resolve(true)
        })

        return WebUser.connecting
    }

    public static async disconnect(): Promise<void> {
        try {
            const context = await this.getContext()
            await context.disconnect()

            WebUser.context = undefined
            WebUser.account = undefined
            WebUser.profile = undefined
            WebUser.did = undefined
            WebUser.connecting = new Promise((resolve) => { resolve(false) })

            if (this.config.debug) {
                console.log(`Account disconnected`)
            }

            VeridaEvents.emit('disconnect')
        } catch (err: any) {
            if (err.message.match('Not connected')) {
                return
            }

            throw err 
        }
    }

    /**
     * Listen to an event on this user
     * 
     * @param eventName 
     * @param cb 
     */
    public static on(eventName: string, cb: Function): void {
        // @ts-ignore
        VeridaEvents.on(eventName, cb)
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
    static async sendMessage(did: string, message: WebUserMessage): Promise<void> {
        const context = await WebUser.getContext()
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
    public static async isConnected(): Promise<boolean> {
        if (WebUser.did) {
            return true
        }

        if (hasSession(WebUser.config.contextConfig.name)) {
            const connected = await WebUser.connect()
            return connected
        }

        return false
    }

    /**
     * Throw an exception if a user isn't connected
     */
    public static async requireConnection(): Promise<void> {
        const isConnected = await WebUser.isConnected()
        if (!isConnected) {
            throw new Error('Not connected!')
        }
    }

    /**
     * Open a datastore owned by this user
     * 
     * @param schemaURL 
     * @param config 
     * @returns 
     */
    public static async openDatastore(schemaURL: string, config?: DatastoreOpenConfig): Promise<IDatastore> {
        const context = await WebUser.getContext()
        return await context.openDatastore(schemaURL, config)
    }

    /**
     * Open a database owned by this user
     * 
     * @param databaseName 
     * @param config 
     * @returns 
     */
    public static async openDatabase(databaseName: string, config?: DatabaseOpenConfig): Promise<IDatabase> {
        const context = await WebUser.getContext()
        return await context.openDatabase(databaseName, config)
    }


    // @todo
    // public static async requestData() {}
    // public static async sendData() {}
}