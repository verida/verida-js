/*eslint no-console: "off"*/

import PouchDB from 'pouchdb'
import PouchDBFind from 'pouchdb-find'
PouchDB.plugin(PouchDBFind)
import Utils from './utils'

import { PermissionsConfig } from './interfaces'

class PublicDatabase {

    dbHumanName: string
    dbName: string
    dataserver: any
    did: string
    permissions: PermissionsConfig
    isOwner: boolean
    _remoteDb: any

    constructor(dbHumanName: string, dbName: string, dataserver: any, did: string, permissions: PermissionsConfig, isOwner: boolean) {
        this.dbHumanName = dbHumanName;
        this.dbName = dbName;
        this.dataserver = dataserver;
        this.did = did;
        this.permissions = permissions;
        this.isOwner = isOwner;
    }

    async _init() {
        let dsn;

        // If the current application user is the owner of this database, request
        // consent from the user for full access. Otherwise, use public credentials
        // to access the database.
        if (this.isOwner) {
            dsn = await this.dataserver.getDsn();
        } else {
            let publicCreds = await this.dataserver.getPublicCredentials();
            dsn = publicCreds.dsn;
        }
        
        if (!dsn) {
            throw "Unable to locate DSN for public database: " + this.dbHumanName;
        }

        const parent = this;
        
        this._remoteDb = new PouchDB(dsn + this.dbName, {
            cb: function(err: any) {
                if (err) {
                    throw new Error('Unable to connect to remote database: ' + parent.dbHumanName);
                }
            },
            skip_setup: true
        });

        try {
            let info = await this._remoteDb.info();
            if (info.error && info.error == "not_found") {
                if (this.isOwner) {
                    await this.createDb();
                }
                else {
                    throw new Error("Public database not found: " + parent.dbHumanName);
                }
            }
        } catch(err) {
            if (this.isOwner) {
                await this.createDb();
            }
            else {
                throw new Error("Public database not found: " + parent.dbHumanName);
            }
        }
    }

    async createDb() {
        let options = {
            permissions: this.permissions
        };

        let client = await this.dataserver.getClient();

        try {
            await client.createDatabase(this.did, this.dbName, options);
            // There's an odd timing issue that needs a deeper investigation
            await Utils.sleep(1000);
        } catch (err) {
            throw new Error("User doesn't exist or unable to create user database");
        }
    }

    async getDb() {
        if (!this._remoteDb) {
            await this._init();
        }

        return this._remoteDb;
    }

}

export default PublicDatabase;