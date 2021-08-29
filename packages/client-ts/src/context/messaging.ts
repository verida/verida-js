import { AccountInterface } from "@verida/account";

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
    send(did: string, type: string, data: object, message: string, config?: object): Promise<object | null>

    /**
     * Register a callback to fire when a new message is received
     */
    onMessage(callback: any): void

    /**
     * Get the underlying database instance for the inbox
     */
    getInboxDb(): Promise<any>

    connectAccount(account: AccountInterface): Promise<void>

}