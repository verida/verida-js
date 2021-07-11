import BaseStorageEngine from "../base"
import EncryptedDatabase from "./db-encrypted"
import { Database, DatabaseConfig, DatabaseOpenConfig, DatastoreOpenConfig } from '../interfaces'
import DatastoreServerClient from "./client"
import { AccountInterface } from '@verida/account'

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
        this.client.setAccount(account)

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

    public async openDatabase(databaseName: string, options: DatabaseOpenConfig): Promise<Database> {
        const config: DatabaseOpenConfig = _.merge({
            permissions: {
                read: "owner",
                write: "owner"
            },
            account: this.account,
            did: this.did,
            saveDatabase: true,
            readOnly: false
        }, options)

        // If permissions require "owner" access, connect the current user
        if ((config.permissions!.read == "owner" || config.permissions!.write == "owner") && !config.readOnly) {
            if (!config.readOnly && !config.account) {
                throw new Error("Unable to open database. Permissions require \"owner\" access, but no account supplied in config.")
            }

            if (!config.readOnly) {
                await this.connectAccount(config.account!) // @todo: there was , true here to force connection. need to audit if this is still needed.
            }
        }

        // Default to user's did if not specified
        let did = config.did
        const accountDid = await config.account?.did()
        if (config.account) {
            did = config.did || this.did!
            config.isOwner = (did == (config.account ? accountDid : false))
        }

        did = did!.toLowerCase()

        let db
        if (config.permissions!.read == "owner" && config.permissions!.write == "owner") {
            const encryptionKey = await this.keyring!.getStorageContextKey(databaseName)
            db = new EncryptedDatabase({
                databaseName,
                did,
                storageContext: this.storageContext,
                dsn: this.dsn!,
                account: config.account,
                permissions: config.permissions,
                readOnly: config.readOnly,
                encryptionKey,
                client: this.client
            })

            await db.init()
            return db
        } else if (config.permissions!.read == "public") {

            // If the current application user is the owner of this database, request
            // consent from the user for full access. Otherwise, use public credentials
            // to access the database

            // CODE FROM publicdatabase constructor
            /*if (this.isOwner) {
                dsn = await this.dataserver.getDsn();
            } else {
                let publicCreds = await this.dataserver.getPublicCredentials();
                dsn = publicCreds.dsn;
            }
            
            if (!dsn) {
                throw "Unable to locate DSN for public database: " + this.dbHumanName;
            }*/
            throw new Error('not implemented')

        } else if (config.permissions!.read == "users" || config.permissions!.write == "users") {
            throw new Error('not implemented')
        } else {
            throw new Error("Unable to create database or it doesn't exist")
        }

        // @todo Cache databases so we don't open the same one more than once
        //let db = new Database(dbName, did, this.appName, this, config);
        

        /*if (config.saveDatabase && db._originalDb && this.dbManager) {
            this.dbManager.saveDb(dbName, did, this.appName, config.permissions, db._originalDb.encryptionKey);
        }*/
    }

    public async openDatastore(schemaName: string, config: DatastoreOpenConfig) {
        throw new Error('Not implemented')
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