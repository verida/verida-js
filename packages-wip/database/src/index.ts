/*eslint no-unused-vars: "off"*/
/*eslint no-console: "off"*/
const crypto = require('crypto')
const uuidv1 = require('uuid/v1')
const EventEmitter = require('events')
const _ = require('lodash')

import EncryptedDatabase from './encrypted'
import PublicDatabase from './public'
import { DatabaseConfig, PermissionOptionsEnum } from './interfaces'

const DatabaseConfigDefaults = {
    signData: true,
    permissions: {
        read: PermissionOptionsEnum.OWNER,
        write: PermissionOptionsEnum.OWNER,
        readList: [],
        writeList: []
    }
}

class Database extends EventEmitter {

    // did = identity/did instance
    //constructor(dbName: string, did: string, appName: string, dataserver: any, config: object) {

    /**
     * Create a new database
     */
    constructor(config: DatabaseConfig) {
        super()
        this.config = { ...DatabaseConfigDefaults, ...config };


        this.dbName = this.config.dbName
        this.did = this.config.did.toLowerCase()
        this.appName = this.config.appName

        // User will be the user who owns this database
        // Will be null if the user isn't the current user
        // (ie: for a public / external database)
        this.user = this.config.user

        // Signing user will be the logged in user
        this.signUser = this.config.signUser || this.config.user
        this.signData = this.config.signData
        this.signAppName = this.config.signAppName || this.appName
        this.dataserver = this.config.dataserver
        this.permissions = this.config.permissions

        /*this.permissions = _.merge({
            read: "owner",
            write: "owner",
            readList: [],
            writeList: []
        }, this.config.permissions ? this.config.permissions : {});*/

        this.readOnly = this.config.readOnly

        this._dbHash = null
        this._db = null
    }

    // DID + AppName + DB Name + readPerm + writePerm
    getDatabaseHash() {
        if (this._dbHash) {
            return this._dbHash;
        }

        let text = [
            this.did,
            this.appName,
            this.dbName
        ].join("/");

        let hash = crypto.createHash('md5').update(text).digest("hex");
        this._dbHash = "v" + hash;

        // Database name must start with a letter
        return this._dbHash;
    }

    /**
     * Save data to an application schema.
     *
     * @param {object} data Data to be saved. Will be validated against the schema associated with this Datastore.
     * @param {object} [options] Database options that will be passed through to [PouchDB.put()](https://pouchdb.com/api.html#create_document)
     * @fires Database#beforeInsert Event fired before inserting a new record
     * @fires Database#beforeUpdate Event fired before updating a new record
     * @fires Database#afterInsert Event fired after inserting a new record
     * @fires Database#afterUpdate Event fired after updating a new record
     * @example
     * let result = await datastore.save({
     *  "firstName": "John",
     *  "lastName": "Doe"
     * });
     *
     * if (!result) {
     *  console.errors(datastore.errors);
     * } else {
     *  console.log("Successfully saved");
     * }
     * @returns {boolean} Boolean indicating if the save was successful. If not successful `this.errors` will be populated.
     */
    async save(data: any, options?: any) {
        await this._init();
        if (this.readOnly) {
            throw "Unable to save. Read only.";
        }

        let defaults = {
            forceInsert: false, // Force inserting a record (will throw exception if it already exists)
            forceUpdate: false  // Force updating record if it already exists
        };
        options = _.merge(defaults, options);

        let insert = false;

        // Set inserted at if not defined
        // (Assuming it's not defined as we have an insert)
        if (data._id === undefined || options.forceInsert) {
            insert = true;
        }

        // If a record exists with the given _id, do an update instead
        // of attempting to insert which will result in a document conflict
        if (options.forceUpdate && data._id !== undefined && data._rev === undefined) {
            try {
                const existingDoc = await this.get(data._id);
                if (existingDoc) {
                    data._rev = existingDoc._rev;
                    insert = false;
                }
            } catch (err) {
                // Record may not exist, which is fine
                if (err.name != "not_found") {
                    throw err
                }
            }
        }

        if (insert) {
            await this._beforeInsert(data);

            /**
             * Fired before a new record is inserted.
             *
             * @event Database#beforeInsert
             * @param {object} data Data that was saved
             */
            this.emit("beforeInsert", data);
        } else {
            await this._beforeUpdate(data);

            /**
             * Fired before a new record is updated.
             *
             * @event Database#beforeUpdate
             * @param {object} data Data that was saved
             */
            this.emit("beforeUpdate", data);
        }

        let response = await this._db.put(data, options);

        if (insert) {
            this._afterInsert(data, response);

            /**
             * Fired after a new record is inserted.
             *
             * @event Database#afterInsert
             * @param {object} data Data that was saved
             */
            this.emit("afterInsert", data, response);
        } else {
            this._afterUpdate(data, response);

            /**
             * Fired after a new record is updated.
             *
             * @event Database#afterUpdate
             * @param {object} data Data that was saved
             */
            this.emit("afterUpdate", data, response);
        }

        return response;
    }

    /**
     * Get many rows from the database.
     *
     * @param {object} filter Optional query filter matching CouchDB find() syntax.
     * @param {object} options Options passed to CouchDB find().
     * @param {object} options.raw Returns the raw CouchDB result, otherwise just returns the documents
     */
    async getMany(filter: any, options?: any) {
        await this._init();

        filter = filter || {};
        let defaults = {
            limit: 20
        }

        options = _.merge(defaults, options);
        filter = this.applySortFix(filter, options.sort || {});

        let raw = options.raw || false;
        delete options['raw'];

        if (filter) {
            options.selector = _.merge(options.selector, filter);
        }

        try {
            let docs = await this._db.find(options);
            if (docs) {
                return raw ? docs : docs.docs;
            }
        } catch (err) {
            console.log(err);
        }

        return;
    }

    async delete(doc: any, options?: any) {
        if (this.readOnly) {
            throw "Unable to delete. Read only.";
        }

        let defaults = {};
        options = _.merge(defaults, options);

        if (typeof(doc) === "string") {
            // Document is a string representing a document ID
            // so fetch the actual document
            doc = await this.get(doc);
        }

        doc._deleted = true;
        return this.save(doc, options);
    }

    async get(docId: string, options?: any) {
        await this._init();

        let defaults = {};
        options = _.merge(defaults, options);

        return await this._db.get(docId, options);
    }

    async _init() {
        if (this._db) {
            return;
        }

        // private data (owner, owner) -- use private
        // public profile (readOnly) -- use public
        // public inbox (public, private) -- is that even possible? may need to be public, public
        // group data -- (users, users)

        let dbHashName = this.getDatabaseHash();

        if (this.permissions.read == "owner" && this.permissions.write == "owner") {
            // Create encrypted database
            try {
                let encryptionKey = await this.dataserver.getDbKey(this.user, dbHashName);
                let remoteDsn = await this.dataserver.getDsn(this.user);
                let db = new EncryptedDatabase(this.dbName, dbHashName, this.dataserver, encryptionKey, remoteDsn, this.did, this.permissions);
                this._originalDb = db;
                this._db = await db.getDb();
            } catch (err) {
                throw new Error("Error creating owner database ("+this.dbName+") for "+this.did+": " + err.message);
            }
        } else if (this.permissions.read == "public") {
            // Create non-encrypted database
            try {
                let db = new PublicDatabase(this.dbName, dbHashName, this.dataserver, this.did, this.permissions, this.config.isOwner);
                this._db = await db.getDb();
            } catch (err) {
                throw new Error("Error creating public database ("+this.dbName+" / "+dbHashName+") for "+this.did+": " + err.message);
            }
        } else if (this.permissions.read == "users" || this.permissions.write == "users") {
            try {
                let encryptionKey = this.config.encryptionKey;
                if (!encryptionKey && this.config.isOwner) {
                    encryptionKey = await this.dataserver.getDbKey(this.user, dbHashName);
                }

                let remoteDsn = await this.dataserver.getDsn(this.user);
                let db = new EncryptedDatabase(this.dbName, dbHashName, this.dataserver, encryptionKey, remoteDsn, this.did, this.permissions);
                this._originalDb = db;
                this._db = await db.getDb();
            } catch (err) {
                console.error(err)
                throw new Error("Error creating encrypted database ("+this.dbName+" for "+this.did+": " + err.message);
            }
        }
        else {
            throw "Unable to create database or it doesn't exist";
        }
    }

    /**
     * Update the users that can access the database
     */
    async updateUsers(readList: string[], writeList: string[]) {
        await this._init();

        this.permissions.readList = readList;
        this.permissions.writeList = writeList;

        return this._originalDb.updateUsers(readList, writeList);
    }

    async _beforeInsert(data: any) {
        if (!data._id) {
            data._id = uuidv1();
        }

        data.insertedAt = (new Date()).toISOString();
        data.modifiedAt = (new Date()).toISOString();
        
        if (this.signData) {
            await this._signData(data);
        }
    }

    async _beforeUpdate(data: any) {
        data.modifiedAt = (new Date()).toISOString();

        if (this.signData) {
            await this._signData(data);
        }
    }

    _afterInsert(data: any, response: any) {}


    _afterUpdate(data: any, response: any) {}

    /**
     * Get the underlying PouchDB instance associated with this database.
     *
     * @see {@link https://pouchdb.com/api.html#overview|PouchDB documentation}
     * @returns {PouchDB}
     */
    async getInstance() {
        await this._init();
        return this._db;
    }

    /**
     * See PouchDB bug: https://github.com/pouchdb/pouchdb/issues/6399
     *
     * This method automatically detects any fields being sorted on and
     * adds them to an $and clause to ensure query indexes are used.
     *
     * Note: This still requires the appropriate index to exist for
     * sorting to work.
     */
    applySortFix(filter: any, sortItems: any) {
        if (sortItems.length) {
            let and = [filter];
            for (var s in sortItems) {
                let sort = sortItems[s];
                for (var fieldName in sort) {
                    let d: any = {};
                    d[fieldName] = {$gt: true};
                    and.push(d);
                }
            }

            filter = {
                $and: and
            }
        }

        return filter;
    }

    /**
     * Sign data as the current user
     *
     * @param {*} data
     * @todo Think about signing data and versions / insertedAt etc.
     */
    async _signData(data: any) {
        if (!this.signUser) {
            throw new Error("Unable to sign data. No signing user specified.");
        }

        this.signUser.signData(data, this.signAppName);
    }

}

export default Database