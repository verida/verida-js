import { VeridaDatabaseConfig } from "./interfaces"
import BaseDb from "./base-db"

import * as PouchDBCryptLib from "pouchdb"
import * as PouchDBLib from "pouchdb"

// See https://github.com/pouchdb/pouchdb/issues/6862
const {default:PouchDBCrypt} = PouchDBCryptLib as any
const {default:PouchDB} = PouchDBLib as any

import * as PouchDBFindLib from "pouchdb-find"
const {default:PouchDBFind} = PouchDBFindLib as any

import * as CryptoPouch from "crypto-pouch"

PouchDBCrypt.plugin(PouchDBFind)
PouchDB.plugin(PouchDBFind)
PouchDBCrypt.plugin(CryptoPouch)


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
     * @param {string} encryptionKey Uint8Array(32) representing encryption key 
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
        if (this._localDb) {
            return
        }

        await super.init()
        
        this._localDbEncrypted = new PouchDB(this.databaseHash)
        this._localDb = new PouchDBCrypt(this.databaseHash)
        
        this._localDb.crypto("", {
            "key": this.encryptionKey
        })

        this._remoteDbEncrypted = new PouchDB(this.dsn + this.databaseHash, {
            skip_setup: true
        })
        
        let info
        try {
            info = await this._remoteDbEncrypted.info()
      
            if (info.error && info.error == "not_found") {
                // Remote dabase wasn't found, so attempt to create it
                await this.createDb()
            }
        } catch (err: any) {
            if (err.error && err.error == "not_found") {
                // Remote database wasn't found, so attempt to create it
                await this.createDb()
            }

            throw err
        }

        if (info && info.error == "forbidden") {
            throw new Error(`Permission denied to access remote database.`)
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
                })
            })
        
        this.db = this._localDb

        /**
         * We attempt to fetch some rows from the database.
         * 
         * If there is data in this database, it ensures the current encryption key
         * can decrypt the data.
         */
        try {
            await this.getMany()
        } catch (err: any) {
            // This error message is thrown by the underlying decrypt library if the
            // data can't be decrypted
            if (err.message == `Unsupported state or unable to authenticate data`) {
                // Clear the instantiated PouchDb instances and throw a more useful exception
                this._localDb = this._localDbEncrypted = this._remoteDbEncrypted = null
                throw new Error(`Invalid encryption key supplied`)
            }

            // Unknown error, rethrow
            throw err
        }
    }

    public async updateUsers(readList: string[] = [], writeList: string[] = []): Promise<void> {
        await this.init()

        this.permissions!.readList = readList
        this.permissions!.writeList = writeList

        const options = {
            permissions: this.permissions
        }

        try {
            this.client.updateDatabase(this.did, this.databaseHash, options);
        } catch (err: any) {
            throw new Error("User doesn't exist or unable to create user database")
        }
    }

    public async getDb(): Promise<any> {
        await this.init()

        return this._localDb
    }

    public async getRemoteEncrypted(): Promise<any> {
        await this.init()
        return this._remoteDbEncrypted
    }

    public async getLocalEncrypted(): Promise<any> {
        await this.init()
        return this._localDbEncrypted
    }

    public getEncryptionKey(): Uint8Array {
        return this.encryptionKey!
    }

    public async info(): Promise<any> {
        await this.init()

        const info = {
            type: 'VeridaStorage',
            privacy: 'encrypted',
            did: this.did,
            dsn: this.dsn,
            storageContext: this.storageContext,
            databaseName: this.databaseName,
            databasehash: this.databaseHash,
            encryptionKey: this.encryptionKey!
            // @todo: add databases
        }

        return info
    }

}