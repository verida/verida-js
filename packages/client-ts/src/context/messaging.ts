import { Account } from "@verida/account";
import { MessageSendConfig } from "./interfaces";

/**
 * Interface Messaging
 */
export default interface Messaging {
  /**
   * Initialize messaging for the connected user
   *
   * (ie; create an empty database or anything else required to start receiving messages)
   */
  init(): Promise<void>;

  /**
   * Send a message to another DID on the network.
   *
   * @todo: Link to documentation
   *
   * @param did string DID to receive the message
   * @param type string Type of inbox message (See https://github.com/verida/schemas/tree/master/schemas/inbox/type). ie: `dataSend`
   * @param data object Data to send. Structure of data will depend on the inbox message type.
   * @param message string A human readable message that will be displayed to the user upon receipt of the message. Similar to an email subject.
   * @param config object Optional configuration.
   */
  send(
    did: string,
    type: string,
    data: object,
    message: string,
    config: MessageSendConfig
  ): Promise<object | null>;

  /**
   * Register a callback to fire when a new message is received from another DID or application.
   *
   * Usage:
   *
   * ```
   * // configure the listener
   * const callback = (msg) => { console.log(msg) }
   * const emitter = messaging.onMessage(callback)
   * ```
   *
   * @return {Promise<EventEmitter>} Returns an event emitter
   */
  onMessage(callback: any): Promise<EventEmitter>;

  /**
   * Unregister a callback to fire when a new message is received
   *
   * @param callback
   */
  offMessage(callback: any): Promise<void>;

  /**
   * Get messages from this inbox.
   *
   * @param filter object An optional datastore filter
   * @param options object An optional list of datastore options
   */
  getMessages(filter?: object, options?: any): Promise<any>;

  /**
   * Get the underlying inbox instance specific for the message storage type.
   *
   * @returns any Currently returns a `Datastore` instance.
   */
  getInbox(): Promise<any>;

  /**
   * Connect an account to this messaging instance.
   *
   * Used internally.
   *
   * @param account Account
   */
  connectAccount(account: Account): Promise<void>;
}
