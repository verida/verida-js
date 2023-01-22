import { Network, Context, Profile } from '@verida/client-ts';
import { VaultAccount, hasSession, VaultAccountConfig } from './index';
import { EventEmitter } from 'events'
import { MessageSendConfig } from '@verida/client-ts/dist/context/interfaces';

const VeridaEvents = new EventEmitter()

export interface WebUserProfile {
    name?: string
    avatarUri: string
    country?: string
    description?: string
}

export interface WebUserConfig {
    accountConfig: VaultAccountConfig
    clientConfig: ClientConfig
    contextConfig: ContextConfig
    networkConfig: NetworkConnectionConfig
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
 * 
 * @event profileChanged
 * @event connected
 * @event disconnected
 */
export class WebUser {

    private static config: WebUserConfig
    private static context?: Context
    private static account?: VaultAccount
    private static profile?: WebUserProfile
    private static did?: string

    private static connecting: Promise<boolean>
    private static profileConnection: Profile

    public static configure(config: WebUserConfig) {
        WebUser.config = config
    }

    public static async getContext() {
        await WebUser.requireConnection()
        return WebUser.context
    }

    public static async getAccount() {
        await WebUser.requireConnection()

        return WebUser.account
    }

    public static async getDid() {
        await WebUser.requireConnection()

        return WebUser.did
    }

    public static async getPublicProfile(force: boolean = false) {
        await WebUser.requireConnection()

        if (!force && WebUser.profile) {
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
            name: await profile.get('name')
        }

        return WebUser.profile
    }

    /**
     * Connect the user to the Verida Network
     *
     * @returns A Promise that will resolve to true / false depending on if the user is connected
     */
    public static async connect() {
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
                console.log(
                    'User cancelled login attempt by closing the QR code modal or an unexpected error occurred'
                );

                resolve(false)
            }

            const did = await account.did()
            console.log(`Account connected with did: ${did}`)

            WebUser.account = account
            WebUser.context = context!
            WebUser.did = did

            const profile = await WebUser.getPublicProfile()

            VeridaEvents.emit('connected', profile)
            resolve(true)
        })

        return WebUser.connecting
    }

    public static async disconnect() {
        await this.requireConnection()
        await WebUser.context!.close()

        WebUser.context = undefined
        WebUser.account = undefined
        WebUser.profile = undefined
        WebUser.did = undefined
        WebUser.connecting = new Promise((resolve) => { resolve(false) })

        VeridaEvents.emit('disconnect')
    }

    /**
     * Listen to an event on this user
     * 
     * @param eventName 
     * @param cb 
     */
    public static on(eventName: string, cb: Function) {
        // @ts-ignore
        VeridaEvents.on(eventName, cb)
    }

    /**
     * Send a message to a user's Verida Wallet
     * 
     * @param {*} did 
     * @param {*} subject 
     * @param {*} message 
     * @param {*} linkUrl 
     * @param {*} linkText 
     */
    static async sendMessage(did: string, message: WebUserMessage) {
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
     * Will auto-load from local storage if it exists.
     * 
     * @returns 
     */
    public static async isConnected() {
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
    public static async requireConnection() {
        const isConnected = await WebUser.isConnected()
        if (!isConnected) {
            throw new Error('Not connected!')
        }
    }


    // @todo
    // public static async requestData() {}
    // public static async sendData() {}
}