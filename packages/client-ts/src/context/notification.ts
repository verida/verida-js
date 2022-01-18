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
     */
    ping(config?:MessageSendConfig): Promise<boolean>

    getErrors(): string[]

}