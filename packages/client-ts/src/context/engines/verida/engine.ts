import BaseStorageEngine from "../base"
import EncryptedDatabase from "./db-encrypted"
import Database from '../../database'
import Datastore from '../../datastore'
import { DatabaseOpenConfig, DatastoreOpenConfig } from '../../interfaces'
import DatastoreServerClient from "./client"
import { AccountInterface } from '@verida/account'
import PublicDatabase from "./db-public"

const _ = require('lodash')

export default class StorageEngineVerida extends BaseStorageEngine {

    private client: DatastoreServerClient

    private publicCredentials: any  // @todo

    private did?: string
    private dsn?: string

    // @todo: dbmanager
    constructor(storageContext: string, endpointUri: string) {
        super(storageContext, endpointUri)
        this.client = new DatastoreServerClient(this.storageContext, this.endpointUri)
    }

    public async connectAccount(account: AccountInterface) {
        super.connectAccount(account)

        this.did = await this.account!.did()
        await this.client.setAccount(account)

        // Fetch user details from server
        let response
        try {
            response = await this.client.getUser(this.did!)
        } catch (err) {
            if (err.response && err.response.data.data && err.response.data.data.did == "Invalid DID specified") {
                // User doesn't exist, so create them
                response = await this.client.createUser()
            }
            else if (err.response && err.response.statusText == "Unauthorized") {
                throw new Error("Invalid signature or permission to access DID server");
            }
            else {
                // Unknown error
                throw err;
            }
        }

        const user = response.data.user;
        this.dsn = user.dsn
    }

    protected async buildExternalDsn(endpointUri: string, did: string): Promise<string> {
        const client = new DatastoreServerClient(this.storageContext, endpointUri)
        await client.setAccount(this.account!)
        let response
        try {
            response = await client.getUser(this.did!)
        } catch (err) {
            if (err.response && err.response.data.data && err.response.data.data.did == "Invalid DID specified") {
                // User doesn't exist, so create on this endpointUri server
                response = await client.createUser()
            }
            else if (err.response && err.response.statusText == "Unauthorized") {
                throw new Error("Invalid signature or permission to access DID server");
            }
            else {
                // Unknown error
                throw err;
            }
        }

        return response.data.user.dsn
    }

    /**
     * Open a database owned by this user
     * 
     * @param databaseName 
     * @param options 
     * @returns 
     */
    public async openDatabase(databaseName: string, options: DatabaseOpenConfig): Promise<Database> {
        const config: DatabaseOpenConfig = _.merge({
            permissions: {
                read: "owner",
                write: "owner"
            },
            did: this.did,
            readOnly: false
        }, options)

        // Default to user's did if not specified
        config.isOwner = config.did == this.did
        config.saveDatabase = config.isOwner            // always save this database to registry if user is the owner
        let did = config.did!.toLowerCase()

        // If permissions require "owner" access, connect the current user
        if ((config.permissions!.read == "owner" || config.permissions!.write == "owner") && !config.readOnly) {
            if (!config.readOnly && !this.keyring) {
                throw new Error(`Unable to open database. Permissions require "owner" access, but no account connected.`)
            }

            if (!config.readOnly && config.isOwner && !this.keyring) {
                throw new Error(`Unable to open database. Permissions require "owner" access, but account is not owner.`)
            }

            if (!config.readOnly && !config.isOwner && config.permissions!.read == "owner") {
                throw new Error(`Unable to open database. Permissions require "owner" access to read, but account is not owner.`)
            }
        }

        let dsn = config.isOwner ? this.dsn! : config.dsn!
        if (!dsn) {
            throw new Error("Unable to determine DSN for this user and this context")
        }

        if (config.permissions!.read == "owner" && config.permissions!.write == "owner") {
            if (!this.keyring) {
                throw new Error(`Unable to open database. Permissions require "owner" access, but no account connected.`)
            }

            const storageContextKey = await this.keyring!.getStorageContextKey(databaseName)
            const encryptionKey = storageContextKey.secretKey
            const db = new EncryptedDatabase({
                databaseName,
                did,
                storageContext: this.storageContext,
                dsn,
                permissions: config.permissions,
                keyring: this.keyring,
                signDid: this.did,
                readOnly: config.readOnly,
                encryptionKey,
                client: this.client,
                isOwner: config.isOwner
            })

            await db.init()
            return db
        } else if (config.permissions!.read == "public") {
            // If we aren't the owner of this database use the public credentials
            // to access this database
            if (!config.isOwner) {
                const publicCreds = await this.getPublicCredentials()
                dsn = publicCreds.dsn

                if (config.permissions!.write != 'public') {
                    config.readOnly = true
                }
            }

            const db = new PublicDatabase({
                databaseName,
                did,
                storageContext: this.storageContext,
                dsn,
                permissions: config.permissions,
                keyring: this.keyring,
                signDid: this.did,
                readOnly: config.readOnly,
                client: this.client,
                isOwner: config.isOwner
            })
            
            await db.init()
            return db

        } else if (config.permissions!.read == "users" || config.permissions!.write == "users") {
            if (config.isOwner && !this.keyring) {
                throw new Error(`Unable to open database as the owner. No account connected.`)
            }

            if (!config.isOwner && !config.encryptionKey) {
                throw new Error(`Unable to open external database. No encryption key in config.`)
            }

            /**
             * We could be connecting to:
             * - A database we own
             *  - Need to connect using our dsn (this.dsn)
             * - An database owned by another user
             *  - Need to connect to the user's database server
             *  - Need to authenticate as ourselves
             *  - Need to talk to the db hash for the did that owns the database
             */

            if (!config.isOwner) {
                // need to build a complete dsn
                dsn = await this.buildExternalDsn(config.dsn!, config.did!)
            }

            const storageContextKey = await this.keyring!.getStorageContextKey(databaseName)
            const encryptionKey = config.encryptionKey ? config.encryptionKey : storageContextKey.secretKey

            const db = new EncryptedDatabase({
                databaseName,
                did,
                storageContext: this.storageContext,
                dsn,
                permissions: config.permissions,
                keyring: this.keyring,
                signDid: this.did,
                readOnly: config.readOnly,
                encryptionKey,
                client: this.client,
                isOwner: config.isOwner
            })
            
            try {
                await db.init()
            } catch (err) {
                if (err.status == 401 && err.code == 90) {
                    throw new Error(`Unable to open database. Invalid credentials supplied.`)
                }

                throw err
            }

            return db
        } else {
            throw new Error("Unable to open database. Invalid permissions configuration.")
        }

        // @todo Cache databases so we don't open the same one more than once
        //let db = new Database(dbName, did, this.appName, this, config);
        

        /*if (config.saveDatabase && db._originalDb && this.dbManager) {
            this.dbManager.saveDb(dbName, did, this.appName, config.permissions, db._originalDb.encryptionKey);
        }*/
    }

    public logout() {
        super.logout()
        this.client = new DatastoreServerClient(this.storageContext, this.endpointUri)
    }

    private async getPublicCredentials() {
        if (this.publicCredentials) {
            return this.publicCredentials
        }

        const response = await this.client.getPublicUser()
        this.publicCredentials = response.data.user
        return this.publicCredentials
    }

}