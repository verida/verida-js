const EventEmitter = require('events')
const _ = require('lodash')
import { v1 as uuidv1 } from 'uuid'
import * as jsSHA from "jssha"

import { VeridaDatabaseConfig } from "./interfaces"
import Database from '../../../database'
import { PermissionsConfig } from '../../../interfaces'
import { StorageLink } from '@verida/storage-link'
import DatastoreServerClient from "./client"
import Utils from './utils'
import { Context } from '../../../..'
import { DbRegistryEntry } from '../../../db-registry'

export default class BaseDb extends EventEmitter implements Database {

    protected databaseName: string
    protected did: string
    protected dsn: string
    protected storageContext: string

    protected permissions?: PermissionsConfig
    protected isOwner?: boolean

    protected signContext: Context
    protected signData?: boolean
    protected signContextName: string

    protected databaseHash: string
    
    protected client: DatastoreServerClient

    // PouchDb instance for this database
    protected db?: any

    constructor(config: VeridaDatabaseConfig) {
        super()
        this.client = config.client
        this.databaseName = config.databaseName
        this.did = config.did.toLowerCase()
        this.dsn = config.dsn
        this.storageContext = config.storageContext

        this.isOwner = config.isOwner
        this.signContext = config.signContext

        // Signing user will be the logged in user
        const account = this.signContext.getAccount()

        this.signData = config.signData === false ? false : true
        this.signContextName = this.signContext.getContextName()

        this.config = _.merge({}, config)

        this.permissions = _.merge({
            read: "owner",
            write: "owner",
            readList: [],
            writeList: []
        }, this.config.permissions ? this.config.permissions : {})

        this.readOnly = this.config.readOnly ? true : false;

        this.databaseHash = this.buildDatabaseHash()
        this.db = null;
    }

    // DID + context name + DB Name + readPerm + writePerm
    private buildDatabaseHash() {
        let text = [
            this.did,
            this.storageContext,
            this.databaseName
        ].join("/")

        const hash = this.buildHash(text)

        // Database name in CouchDB must start with a letter, so prepend a `v`
        return "v" + hash
    }

    protected buildHash(text: string) {
        const jsHash = new jsSHA.default('SHA-256', 'TEXT')
        jsHash.update(text)
        return jsHash.getHash('HEX')
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
    public async save(data: any, options: any = {}): Promise<boolean> {
        await this.init()
        if (this.readOnly) {
            throw new Error("Unable to save. Database is read only.")
        }

        let defaults = {
            forceInsert: false, // Force inserting a record (will throw exception if it already exists)
            forceUpdate: false  // Force updating record if it already exists
        };
        options = _.merge(defaults, options)

        let insert = false

        // Set inserted at if not defined
        // (Assuming it's not defined as we have an insert)
        if (data._id === undefined || options.forceInsert) {
            insert = true
        }

        // If a record exists with the given _id, do an update instead
        // of attempting to insert which will result in a document conflict
        if (options.forceUpdate && data._id !== undefined && data._rev === undefined) {
            try {
                const existingDoc = await this.get(data._id)
                if (existingDoc) {
                    data._rev = existingDoc._rev
                    insert = false
                }
            } catch (err: any) {
                // Record may not exist, which is fine
                if (err.name != "not_found") {
                    throw err
                }
            }
        }

        if (insert) {
            data = await this._beforeInsert(data)

            /**
             * Fired before a new record is inserted.
             *
             * @event Database#beforeInsert
             * @param {object} data Data that was saved
             */
            this.emit("beforeInsert", data)
        } else {
            data = await this._beforeUpdate(data)

            /**
             * Fired before a new record is updated.
             *
             * @event Database#beforeUpdate
             * @param {object} data Data that was saved
             */
            this.emit("beforeUpdate", data)
        }

        let response = await this.db.put(data, options)

        if (insert) {
            this._afterInsert(data, options)

            /**
             * Fired after a new record is inserted.
             *
             * @event Database#afterInsert
             * @param {object} data Data that was saved
             */
            this.emit("afterInsert", data, response)
        } else {
            this._afterUpdate(data, options)

            /**
             * Fired after a new record is updated.
             *
             * @event Database#afterUpdate
             * @param {object} data Data that was saved
             */
            this.emit("afterUpdate", data, response)
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
    public async getMany(filter: any = {}, options: any = {}): Promise<object[] | undefined> {
        await this.init()

        filter = filter || {}
        let defaults = {
            limit: 20
        }

        options = _.merge(defaults, options)
        filter = this.applySortFix(filter, options.sort || {})

        let raw = options.raw || false
        delete options['raw']

        if (filter) {
            options.selector = _.merge(options.selector, filter)
        }

        let docs = await this.db.find(options)
        if (docs) {
            return raw ? docs : docs.docs
        }

        return
    }

    public async delete(doc: any, options: any = {}) {
        if (this.readOnly) {
            throw "Unable to delete. Read only."
        }

        await this.init()

        let defaults = {}
        options = _.merge(defaults, options)

        if (typeof(doc) === "string") {
            // Document is a string representing a document ID
            // so fetch the actual document
            doc = await this.get(doc)
        }

        doc._deleted = true;
        return this.save(doc, options)
    }

    public async deleteAll(): Promise<void> {
        let rows: any = await this.getMany()
        if (rows.length == 0) {
            return
        }

        let rowId: any
        for (rowId in rows) {
            await this.delete(rows![rowId]['_id'])
        }

        await this.deleteAll()
    }

    public async get(docId: string, options: any = {}) {
        await this.init()

        let defaults = {}
        options = _.merge(defaults, options)

        return await this.db.get(docId, options)
    }

    /**
     * Bind to changes to this database
     * 
     * @param {function} cb Callback function that fires when new data is received
     */
    public async changes(cb: Function, options: any = {}) {
        await this.init()
        
        const dbInstance = await this.getDb()
        return dbInstance.changes(_.merge({
            since: 'now',
            live: true
        }, options)).on('change', async function(info: any) {
            cb(info)
        })
    }

    // This will be extended by sub-classes to initialize the database connection
    public async init() {
    }

    /**
     * Update the users that can access the database
     */
    public async updateUsers(readList: string[] = [], writeList: string[] = []) {
        throw new Error('Not implemented')
    }

    public async registryEntry(): Promise<DbRegistryEntry> {
        throw new Error('Not implemented')
    }

    protected async _beforeInsert(data: any) {
        if (!data._id) {
            // Do it in this way to ensure _id is the first JSON property
            // When a result is returned from CouchDB it always returns _id as
            // the first property, so this ensures consistency of order which
            // is necessary when validating data signatures
            data = _.merge({
                _id: uuidv1()
            }, data)
        }

        data.insertedAt = (new Date()).toISOString()
        data.modifiedAt = (new Date()).toISOString()
        
        if (this.signData) {
            await this._signData(data)
        }

        return data
    }

    protected async _beforeUpdate(data: any) {
        data.modifiedAt = (new Date()).toISOString()

        if (this.signData) {
            await this._signData(data)
        }

        return data
    }

    protected _afterInsert(data: any, response: any) {}

    protected _afterUpdate(data: any, response: any) {}

    /**
     * Get the underlying PouchDB instance associated with this database.
     *
     * @see {@link https://pouchdb.com/api.html#overview|PouchDB documentation}
     * @returns {PouchDB}
     */
    public async getDb(): Promise<any> {
        throw new Error('Not implemented')
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
    private applySortFix(filter: any = {}, sortItems: any = {}) {
        if (sortItems.length) {
            let and = [filter]
            for (var s in sortItems) {
                let sort = sortItems[s]
                for (var fieldName in sort) {
                    let d: any = {}
                    d[fieldName] = {$gt: true}
                    and.push(d)
                }
            }

            filter = {
                $and: and
            }
        }

        return filter
    }

    /**
     * Sign data as the current user
     *
     * @param {*} data
     * @todo Think about signing data and versions / insertedAt etc.
     */
    protected async _signData(data: any) {
        const account = this.signContext.getAccount()
        const signDid = await account.did()
        const keyring = await account.keyring(this.signContextName)

        if (!data.signatures) {
            data.signatures = {}
        }

    
        const signContextHash = StorageLink.hash(`${signDid}/${this.signContextName}`)
        const signKey = `${signDid}:${signContextHash}`

        let _data = _.merge({}, data)
        delete _data['signatures']

        data.signatures[signKey] = await keyring.sign(_data)
        return data
    }

    protected async createDb() {
        const options = {
            permissions: this.permissions
        };

        try {
            await this.client.createDatabase(this.did, this.databaseHash, options)
            // There's an odd timing issue that needs a deeper investigation
            await Utils.sleep(1000)
        } catch (err) {
            throw new Error("User doesn't exist or unable to create user database")
        }
    }

    public async info(): Promise<any> {
        throw new Error('Not implemented')
    }

}