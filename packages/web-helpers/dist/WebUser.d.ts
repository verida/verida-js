/// <reference types="node" />
import { Client, Context } from '@verida/client-ts';
import { VaultAccount } from '@verida/account-web-vault';
import { EventEmitter } from 'events';
import { ClientConfig, ContextConfig, IDatastore, IDatabase, DatabaseOpenConfig, DatastoreOpenConfig, AccountVaultConfig } from '@verida/types';
export interface WebUserProfile {
    name?: string;
    avatarUri: string;
    country?: string;
    description?: string;
}
export interface WebUserConfig {
    clientConfig: ClientConfig;
    accountConfig: AccountVaultConfig;
    contextConfig: ContextConfig;
    debug?: boolean;
}
export interface WebUserMessage {
    subject: string;
    text: string;
    link?: WebUserMessageLink;
}
export interface WebUserMessageLink {
    url: string;
    text: string;
}
/**
 * Usage:
 *
 * 1. Configure with this.configure(...)
 * 2. Check if the user is logged in with this.isConnected()
 * 3. Log the user in with this.connect()
 * 4. Listen to when the user has logged in with this.on('connected')
 * 5. Listen to when the user updates their profile with this.on('profileUpdated')
 * 5. Listen to when the user logs out with this.on('disconnected')
 *
 * @event profileChanged
 * @event connect
 * @event disconnected
 */
export declare class WebUser extends EventEmitter {
    private config;
    private client?;
    private context?;
    private account?;
    private profile?;
    private did?;
    private connecting?;
    private profileConnection?;
    constructor(config: WebUserConfig);
    getClient(): Promise<Client>;
    getContext(): Promise<Context>;
    getAccount(): Promise<VaultAccount>;
    getDid(): Promise<string>;
    /**
     *
     * @param ignoreCache Ignore the cached version of the profile and force refresh a new copy of the profile
     * @returns
     */
    getPublicProfile(ignoreCache?: boolean): Promise<WebUserProfile>;
    /**
     * Connect the user to the Verida Network
     *
     * @emit connected When the user successfully logs in
     * @returns A Promise that will resolve to true / false depending on if the user is connected
     */
    connect(): Promise<boolean>;
    disconnect(): Promise<void>;
    /**
     * Send a generic message to a user's Verida Wallet
     *
     * @param {*} did
     * @param {*} subject
     * @param {*} message
     * @param {*} linkUrl
     * @param {*} linkText
     */
    sendMessage(did: string, message: WebUserMessage): Promise<void>;
    /**
     * Is a user connected?
     *
     * Will auto-connect the user from local storage session if it exists.
     *
     * @returns
     */
    isConnected(): Promise<boolean>;
    /**
     * Throw an exception if a user isn't connected
     */
    private requireConnection;
    /**
     * Open a datastore owned by this user
     *
     * @param schemaURL
     * @param config
     * @returns
     */
    openDatastore(schemaURL: string, config?: DatastoreOpenConfig): Promise<IDatastore>;
    /**
     * Open a database owned by this user
     *
     * @param databaseName
     * @param config
     * @returns
     */
    openDatabase(databaseName: string, config?: DatabaseOpenConfig): Promise<IDatabase>;
}
