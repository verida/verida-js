import PouchDBCrypt from 'pouchdb'
import PouchDB from 'pouchdb'
import PouchDBFind from 'pouchdb-find'

PouchDBCrypt.plugin(PouchDBFind)
PouchDB.plugin(PouchDBFind)

const CryptoPouch = require('crypto-pouch')
PouchDBCrypt.plugin(CryptoPouch)

import { VeridaDatabaseConfig } from "./interfaces"
import BaseDb from './base-db'

//db = new EncryptedDatabase(databaseName, did, this.dsn!, encryptionKey, config.permissions)

export default class EncryptedDatabase extends BaseDb {

    protected encryptionKey: Buffer
    
    private _sync: any
    private _localDbEncrypted: any
    private _localDb: any
    private _remoteDbEncrypted: any

    /**
     * 
     * @param {*} dbName 
     * @param {*} dataserver 
     * @param {string} encryptionKey sep256k1 hex string representing encryption key (0x)
     * @param {*} remoteDsn 
     * @param {*} did 
     * @param {*} permissions 
     */
    //constructor(dbHumanName: string, dbName: string, dataserver: any, encryptionKey: string | Buffer, remoteDsn: string, did: string, permissions: PermissionsConfig) {
    constructor(config: VeridaDatabaseConfig) {
        super(config)

        // Automatically convert encryption key to a Buffer if it's a hex string
        /*if (typeof(encryptionKey) == 'string') {
            this.encryptionKey = Buffer.from(encryptionKey.slice(2), 'hex');
        } else {
            this.encryptionKey = encryptionKey
        }*/
        this.encryptionKey = config.encryptionKey!

        // PouchDB sync object
        this._sync = null;
    }

    public async init() {
        await super.init()
        
        this._localDbEncrypted = new PouchDB(this.databaseHash)
        this._localDb = new PouchDBCrypt(this.databaseHash)
        
        this._localDb.crypto("", {
            "key": this.encryptionKey,
            cb: function(err: any) {
                if (err) {
                    throw new Error('Unable to connect to local database')
                }
            }
        })

        this._remoteDbEncrypted = new PouchDB(this.dsn + this.databaseHash, {
            skip_setup: true
        })
        
        try {
            let info = await this._remoteDbEncrypted.info()
      
            if (info.error && info.error == "not_found") {
                // Remote dabase wasn't found, so attempt to create it
                await this.createDb()
            }
        } catch (err) {
            if (err.error && err.error == "not_found") {
                // Remote database wasn't found, so attempt to create it
                await this.createDb()
            } else {
                throw new Error('Unknown error occurred attempting to get information about remote encrypted database')
            }
        }

        const databaseName = this.databaseName
        const dsn = this.dsn
        const _localDbEncrypted = this._localDbEncrypted
        const _remoteDbEncrypted = this._remoteDbEncrypted
        let _sync = this._sync

        // Do a once off sync to ensure the local database pulls all data from remote server
        // before commencing live syncronisation between the two databases
        await this._localDbEncrypted.replicate.from(this._remoteDbEncrypted)
            .on("error", function(err: any) {
                console.error(`Unknown error occurred with replication snapshot from remote database: ${databaseName} (${dsn})`)
                console.error(err)
            })
            .on("denied", function(err: any) {
                console.error(`Permission denied with replication snapshot from remote database: ${databaseName} (${dsn})`)
                console.error(err)
            })
            .on("complete", function(info: any) {
                // Commence two-way, continuous, retrivable sync
                _sync = PouchDB.sync(_localDbEncrypted, _remoteDbEncrypted, {
                    live: true,
                    retry: true,
                    // Dont sync design docs
                    filter: function(doc: any) {
                        return doc._id.indexOf('_design') !== 0;
                    } 
                }).on("error", function(err: any) {
                    console.error(`Unknown error occurred syncing with remote database: ${databaseName} (${dsn})`)
                    console.error(err)
                }).on("denied", function(err: any) {
                    console.error(`Permission denied to sync with remote database: ${databaseName} (${dsn})`)
                    console.error(err)
                });
            });
    }

    public async updateUsers(readList: string[] = [], writeList: string[] = []) {
        await this.init()

        this.permissions!.readList = readList
        this.permissions!.writeList = writeList

        const options = {
            permissions: this.permissions
        }

        try {
            this.client.updateDatabase(this.did, this.dbName, options);
        } catch (err) {
            throw new Error("User doesn't exist or unable to create user database")
        }
    }

    public async getDb(): Promise<any> {
        if (!this._localDb) {
            await this._init()
        }

        return this._localDb
    }

}