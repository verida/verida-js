import AccountInterface from '../account-interface'
import { MessageSendConfig } from "./interfaces"

export default interface Messaging {

    /**
     * Initialize messaging for the connected user
     * 
     * (ie; create an empty database or anything else required to start receiving messages)
     */
    init(): Promise<void>

    /**
     * Send a message to another DID on the network
     * 
     * @param did 
     * @param type 
     * @param data 
     * @param message 
     * @param config 
     */
    send(did: string, type: string, data: object, message: string, config?: MessageSendConfig): Promise<object | null>

    /**
     * Register a callback to fire when a new message is received
     */
    onMessage(callback: any): void

    /**
     * Get messages from this inbox
     * 
     * @param filter 
     * @param options 
     */
    getMessages(filter: object, options: any): Promise<any>

    /**
     * Get the underlying inbox instance specific for the message storage type
     */
    getInbox(): Promise<any>

    connectAccount(account: AccountInterface): Promise<void>

}