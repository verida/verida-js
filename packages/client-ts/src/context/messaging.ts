import { AccountInterface } from "@verida/account";
import { MessageSendConfig } from "./interfaces"

export default interface Messaging {

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
     * Get the underlying database instance for the inbox
     */
    getInboxDb(): Promise<any>

    connectAccount(account: AccountInterface): Promise<void>

}