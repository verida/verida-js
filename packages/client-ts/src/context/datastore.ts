const _ = require('lodash')
import { DatastoreOpenConfig } from "./interfaces"
import Context from "./context"
import Schema from "./schema"

/**
 * A datastore wrapper around a given database and schema.
 * 
 * @property {array} errors Array of most recent errors.
 * @property {string} schemaName Name of the schema used on this Datastore.
 */
export default class Datastore {

    protected schemaName: string
    protected schemaPath?: string
    protected schema?: any

    protected context: Context
    protected storageContext: string
    protected config: DatastoreOpenConfig

    protected errors: object = {}
    private db: any

    /**
     * Create a new Datastore.
     * 
     * **Do not instantiate directly.**
     * @example <caption>Binding to database changes</caption>
     * // open datastore and fetch database
     * let datastore = await app.openDataStore("employment");
     * let db = datastore.getDb();
     * 
     * // fetch underlying PouchDB instance (see PouchDB docs)
     * let pouch = db.getInstance();
     * pouch.changes({
     *      since: 'now',
     *      live: true,
     *      include_docs: true
     *  }).on('change', function() {
     *      console.log("Data has changed in the database");
     *  });
     * @example <caption>Binding to database events</caption>
     * let datastore = await app.openDataStore("employment");
     * let db = datastore.getDb();
     * 
     * db.on("afterInsert", function(data, response) {
     *  console.log("afterInsert() fired");
     *  console.log("Saved data", data);
     * }
     */
    constructor(schemaName: string, context: Context, config: DatastoreOpenConfig = {}) {
        this.schemaName = schemaName
        this.context = context
        this.storageContext = context.getContextName()
        this.config = config
        
        this.db = null
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
    public async save(data: any, options: any = {}): Promise<object | boolean> {
        await this.init()

        data.schema = this.schemaPath
        let valid = await this.schema.validate(data)

        if (!valid) {
            this.errors = this.schema.errors
            return false
        }

        return this.db.save(data, options)
    }

    /**
     * Fetch a list of records from this Datastore.
     * 
     * Only returns records that belong to this Datastore's schema.
     * 
     * @param {object} [customFilter] Database query filter to restrict the results passed through to [PouchDB.find()](https://pouchdb.com/api.html#query_index)
     * @param {object} [options] Database options that will be passed through to [PouchDB.find()](https://pouchdb.com/api.html#query_index)
     * @example
     * let results = datastore.getMany({
     *  name: 'John'
     * });
     * 
     * console.log(results);
     */
    public async getMany(customFilter: any = {}, options: any = {}): Promise<object[]> {
        await this.init()

        let filter = _.merge({
            schema: this.schemaPath
        }, customFilter)

        return this.db.getMany(filter, options)
    }

    public async getOne(customFilter: any = {}, options: any = {}) {
        let results = await this.getMany(customFilter, options);
        if (results && results.length) {
            return results[0]
        }
    }

    /**
     * Get a record by ID.
     * 
     * @param {string} key Unique ID of the record to fetch
     * @param {object} [options] Database options that will be passed through to [PouchDB.get()](https://pouchdb.com/api.html#fetch_document)
     */
    public async get(key: string, options: any = {}) {
        await this.init()
        return this.db.get(key, options)
    }

    /**
     * Delete a record by ID.
     * 
     * @param {string} docId Unique ID of the record to delete
     */
    public async delete(docId: string) {
        await this.init()
        return this.db.delete(docId)
    }

    /**
     * Get the underlying database instance associated with this datastore.
     * 
     * **Note: Do not use unless you know what you're doing as you can easily corrupt a database by breaking schema data.**
     */
    public async getDb() {
        await this.init()
        return this.db
    }

    /**
     * Bind to changes to this datastore
     * 
     * @param {functino} cb Callback function that fires when new data is received
     */
    public async changes(cb: any) {
        const db = await this.getDb()
        const dbInstance = await db.getInstance()
        dbInstance.changes({
            since: 'now',
            live: true
        }).on('change', async function(info: any) {
            cb(info)
        })
    }

    // @todo: move this into context.openDatastore???
    private async init() {
        if (this.db) {
            return
        }

        this.schema = await Schema.getSchema(this.schemaName)
        const schemaJson = await this.schema.getSchemaJson()
        const dbName = this.config.databaseName ? this.config.databaseName : schemaJson.database.name
        this.schemaPath = this.schema.path

        let config = _.merge({
            storageContext: this.storageContext
        }, this.config)

        this.db = await this.context.openDatabase(dbName, config)
        let indexes = schemaJson.database.indexes

        if (indexes) {
            await this.ensureIndexes(indexes)
        }
    }

    // TODO: Support removing indexes that were deleted from the spec
    // TODO: Validate indexes
    public async ensureIndexes(indexes: any) {
        for (var indexName in indexes) {
            let indexFields = indexes[indexName]
            let db = await this.db.getDb()
            await db.createIndex({
                fields: indexFields,
                name: indexName
            })
        }
    }

    public async updateUsers(readList: string[] = [], writeList: string[] = []): Promise<void> {
        await this.init()
        await this.db.updateUsers(readList, writeList)
    }

}