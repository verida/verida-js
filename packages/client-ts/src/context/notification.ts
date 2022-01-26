import { MessageSendConfig } from "./interfaces";

/**
 * Interface for notifications
 */
export default interface Notification {

    /**
     * Initialize notifications for the connected user
     *
     * (ie; connect to a notification server)
     */
    init(): Promise<void>

    /**
     * Ping a notification server to fetch new messages
     * TODO: Change this 
     */
    // *********************************
    ping(recipientContextName:string, did?: any): Promise<boolean>

    getErrors(): string[]

}