import BaseMessage from '../../../messaging'
import { MessagesConfig } from '../../../interfaces'
import Inbox from './inbox'
import Outbox from './outbox'
import { Keyring } from '@verida/keyring'
import { AccountInterface } from '@verida/account'
import StorageEngineVerida from '../database/engine'
import DIDContextManager from '../../../../did-context-manager'
import Context from '../../../context'


export default class MessagingEngineVerida implements BaseMessage {

    private context: Context
    private contextName: string
    private maxItems: Number
    private endpointUri: string
    private dbEngine: StorageEngineVerida
    private didContextManager: DIDContextManager

    private did?: string
    private keyring?: Keyring

    private inbox?: Inbox
    private outbox?: Outbox

    constructor(context: Context, endpointUri: string, config: MessagesConfig) {
        this.context = context
        this.contextName = this.context.getContextName()
        this.endpointUri = endpointUri
        this.maxItems = config.maxItems ? config.maxItems : 50
        this.dbEngine = new StorageEngineVerida(this.contextName, endpointUri)
        this.didContextManager = context.getDidContextManager()
    }

    public async connectAccount(account: AccountInterface) {
        this.did = await account.did()
        this.keyring = await account.keyring(this.contextName)
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

    private async getInbox(): Promise<Inbox> {
        if (this.inbox) {
            return this.inbox
        }

        this.inbox = new Inbox(this.dbEngine, this.keyring!, this.maxItems)
        return this.inbox
    }

    private async getOutbox(): Promise<Outbox> {
        if (this.outbox) {
            return this.outbox
        }

        const outboxDatastore = await this.context.openDatastore("https://schemas.verida.io/outbox/entry/schema.json")
        this.outbox = new Outbox(this.contextName, this.did!, this.keyring!, outboxDatastore, this.context.getClient(), this.didContextManager)
        return this.outbox
    }

}