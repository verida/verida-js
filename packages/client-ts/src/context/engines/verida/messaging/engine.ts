import Context from '../../../context'
import BaseMessage from '../../../messaging'
import { MessagesConfig } from '../../../interfaces'
import Inbox from './inbox'
import Outbox from './outbox'
import { Keyring } from '@verida/keyring'
import { AutoAccount } from '../../../../../../account/dist'

export default class MessagingEngineVerida implements BaseMessage {

    private context: Context
    private maxItems: Number
    private keyring: Keyring
    private endpointUri: string

    private inbox?: Inbox
    private outbox?: Outbox

    constructor(context: Context, keyring: Keyring, endpointUri: string, config: MessagesConfig) {
        this.context = context
        this.keyring = keyring
        this.endpointUri = endpointUri
        this.maxItems = config.maxItems ? config.maxItems : 50
    }

    /**
     * Send a message to another DID on the network
     * 
     * @param did 
     * @param type 
     * @param data 
     * @param message 
     * @param config 
     */
    public async send(did: string, type: string, data: object, message: string, config?: object): Promise<object | null> {
        const outbox = await this.getOutbox()
        return outbox.send(did, type, data, message, config)
    }

    /**
     * Register a callback to fire when a new message is received
     */
    public async onMessage(callback: any): Promise<void> {
        const inbox = await this.getInbox()
        inbox.on('newMessage', callback)
    }

    /**
     * Get the underlying database instance for the inbox
     */
    public async getInboxDb(): Promise<any> {
        const inbox = await this.getInbox()
        return inbox.getInbox()
    }

    /**
     * Get the underlying database instance for the outbox
     */
    public async getOutboxDb(): Promise<any> {

    }

    private async getInbox(): Promise<Inbox> {
        if (this.inbox) {
            return this.inbox
        }

        this.inbox = new Inbox(this.keyring, this.maxItems)
        return this.inbox
    }

    private async getOutbox(): Promise<Outbox> {
        if (this.outbox) {
            return this.outbox
        }

        this.outbox = new Outbox(this.context.getContextName(), this.keyring)
        return this.outbox
    }

}