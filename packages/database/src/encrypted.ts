import PouchDBCrypt from 'pouchdb'
import PouchDB from 'pouchdb'
import PouchDBFind from 'pouchdb-find'
import Utils from "./utils"

PouchDBCrypt.plugin(PouchDBFind)
PouchDB.plugin(PouchDBFind)

const CryptoPouch = require('crypto-pouch')
PouchDBCrypt.plugin(CryptoPouch)

import { PermissionsConfig } from './interfaces'

class EncryptedDatabase {

    dbHumanName: string
    dbName: string
    dataserver: any
    did: string
    permissions: PermissionsConfig
    remoteDsn: string
    encryptionKey: Buffer
    
    _sync: any
    _localDbEncrypted: any
    _localDb: any
    _remoteDbEncrypted: any

    /**
     * 
     * @param {*} dbName 
     * @param {*} dataserver 
     * @param {string} encryptionKey sep256k1 hex string representing encryption key (0x)
     * @param {*} remoteDsn 
     * @param {*} did 
     * @param {*} permissions 
     */
    constructor(dbHumanName: string, dbName: string, dataserver: any, encryptionKey: string | Buffer, remoteDsn: string, did: string, permissions: PermissionsConfig) {
        this.dbHumanName = dbHumanName;
        this.dbName = dbName;
        this.dataserver = dataserver;
        this.did = did;
        this.permissions = permissions;
        this.remoteDsn = remoteDsn;

        // Automatically convert encryption key to a Buffer if it's a hex string
        if (typeof(encryptionKey) == 'string') {
            this.encryptionKey = Buffer.from(encryptionKey.slice(2), 'hex');
        } else {
            this.encryptionKey = encryptionKey
        }

        // PouchDB sync object
        this._sync = null;
    }

    async _init() {
        this._localDbEncrypted = new PouchDB(this.dbName);
        this._localDb = new PouchDBCrypt(this.dbName);
        
        this._localDb.crypto("", {
            "key": this.encryptionKey,
            cb: function(err: any) {
                if (err) {
                    throw new Error('Unable to connect to local database');
                }
            }
        });

        this._remoteDbEncrypted = new PouchDB(this.remoteDsn + this.dbName, {
            skip_setup: true
        });
        
        try {
            let info = await this._remoteDbEncrypted.info();
      
            if (info.error && info.error == "not_found") {
                // Remote dabase wasn't found, so attempt to create it
                await this.createDb();
            }
        } catch (err) {
            if (err.error && err.error == "not_found") {
                // Remote database wasn't found, so attempt to create it
                await this.createDb();
            } else {
                throw new Error('Unknown error occurred attempting to get information about remote encrypted database');
            }
        }

        const parent = this;

        // Do a once off sync to ensure the local database pulls all data from remote server
        // before commencing live syncronisation between the two databases
        await this._localDbEncrypted.replicate.from(this._remoteDbEncrypted)
            .on("error", function(err: any) {
                console.error("Unknown error occurred with replication snapshot from remote database: " + parent.dbHumanName + " (" + parent.remoteDsn +")");
                console.error(err);
            })
            .on("denied", function(err: any) {
                console.error("Permission denied with replication snapshot from remote database: " + parent.dbHumanName + " (" + parent.remoteDsn +")");
                console.error(err);
            })
            .on("complete", function(info: any) {
                // Commence two-way, continuous, retrivable sync
                parent._sync = PouchDB.sync(parent._localDbEncrypted, parent._remoteDbEncrypted, {
                    live: true,
                    retry: true,
                    // Dont sync design docs
                    filter: function(doc: any) {
                        return doc._id.indexOf('_design') !== 0;
                    } 
                }).on("error", function(err: any) {
                    console.error("Unknown error occurred syncing with remote database: " + parent.dbHumanName + " (" + parent.remoteDsn +")");
                    console.error(err);
                }).on("denied", function(err: any) {
                    console.error("Permission denied to sync with remote database: " + parent.dbHumanName + " (" + parent.remoteDsn +")");
                    console.error(err);
                });
            });
    }

    async createDb() {
        const options = {
            permissions: this.permissions
        };

        const client = await this.dataserver.getClient();
        try {
            await client.createDatabase(this.did, this.dbName, options);
            // There's an odd timing issue that needs a deeper investigation
            await Utils.sleep(1000);
        } catch (err) {
            throw new Error("User doesn't exist or unable to create user database");
        }
    }

    async updateUsers(readList: string[], writeList: string[]) {
        this.permissions.readList = readList;
        this.permissions.writeList = writeList;

        const options = {
            permissions: this.permissions
        };

        const client = await this.dataserver.getClient();
        try {
            return client.updateDatabase(this.did, this.dbName, options);
        } catch (err) {
            throw new Error("User doesn't exist or unable to create user database");
        }
    }

    async getDb() {
        if (!this._localDb) {
            await this._init();
        }

        return this._localDb;
    }

}

export default EncryptedDatabase;