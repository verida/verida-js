const RefParser = require('json-schema-ref-parser')
import Ajv from "ajv"
const resolveAllOf = require('json-schema-resolve-allof')
const _ = require('lodash')
import axios from 'axios'

const draft6 = require('ajv/lib/refs/json-schema-draft-06.json')

// Custom resolver for RefParser
//const { ono } = require("ono");
const resolver = {
    order: 1,
    canRead: true,
    async read(file: any) {
        return Schema.loadJson(file.url);
    }
};

const jsonCache: any = {}

export default class Schema {

    public errors: any[]

    protected path: string
    protected ajv: Ajv

    protected schemaJson?: object
    protected finalPath?: string
    protected specification?: any
    protected validateFunction?: any

    protected static schemaPaths?: string[]
    protected static schemas: any = {}

    /**
     * An object representation of a JSON Schema.
     * 
     * **Do not instantiate directly.**
     * 
     * Access via {@link App#getSchema}
     * @param {string} path Path to a schema in the form (http://..../schema.json, /schemas/name/schema.json, name/of/schema)
     * @constructor
     */
    constructor(path: string, options: any = {}) {
        this.path = path
        this.errors = []

        options = _.merge({
            metaSchemas: [
                draft6
            ],
            ajv: {
                loadSchema: Schema.loadJson,
                logger: false,
                strict: false
            }
        }, options)

        this.ajv = new Ajv(options.ajv)

        for (let s in options.metaSchemas) {
            this.ajv.addMetaSchema(options.metaSchemas[s])
        }
    }

    public static async getSchema(schemaName: string): Promise<Schema> {
        if (!Schema.schemas[schemaName]) {
            Schema.schemas[schemaName] = new Schema(schemaName)
        }

        return Schema.schemas[schemaName]
    }

    public static setSchemaPaths(schemaPaths: string[]): void {
        Schema.schemaPaths = schemaPaths
    }

    public static getSchemaPaths(): string[] {
        return Schema.schemaPaths!
    }

    /**
     * @todo: Deprecate in favour of `getProperties()`
     * Get an object that represents the JSON Schema. Fully resolved.
     * Warning: This can cause issues with very large schemas.
     * 
     * @example
     * let schemaDoc = await app.getSchema("social/contact");
     * let spec = schemaDoc.getSpecification();
     * console.log(spec);
     * @returns {object} JSON object representing the defereferenced schema
     */
    public async getSpecification(): Promise<any> {
        if (this.specification) {
            return this.specification
        }

        const path = await this.getPath()
        this.specification = await RefParser.dereference(path, {
            resolve: { http: resolver }
        })

        await resolveAllOf(this.specification)
        return this.specification
    }

    /**
     * Validate a data object with this schema, using AJV
     * 
     * @param {object} data 
     * @returns {boolean} True if the data validates against the schema.
     */
    public async validate(data: any): Promise<boolean> {
        if (!this.validateFunction) {
            const schemaJson = await this.getSchemaJson()
            // @todo: Fix schemas to have valid definitions and then enable strict compile
            this.validateFunction = await this.ajv.compileAsync(schemaJson)
        }

        const valid = await this.validateFunction(data)
        if (!valid) {
            this.errors = this.validateFunction.errors
        }
        
        return valid
    }

    /**
     * Fetch unresolved JSON schema
     */
    public async getSchemaJson(): Promise<object> {
        if (this.schemaJson) {
            return this.schemaJson
        }

        const path = await this.getPath();
        const fileData = await axios.get(path, {
            responseType: 'json'
        })

        this.schemaJson = await fileData.data
        return this.schemaJson!
    }

    public async getAppearance(): Promise<any> {
        const schemaJson = await this.getSpecification()
        const appearance = schemaJson.appearance

        if (appearance.style && appearance.style.icon) {
            let icon = schemaJson.appearance.style.icon
            if (icon.substring(0,2) == './') {
                // support relative icon path
                const path = await this.getPath()
                icon = path.replace("schema.json",icon.substring(2))
            }
            if (icon.substring(0,1) == '/') {
                // support absolute icon path
                const path = await this.getPath()
                const rootPathParts = path.match(/^(https?:\/\/[^\/]*)/)
                if (rootPathParts) {
                    icon = rootPathParts[0] + '/' + icon.substring(1)
                }
            }

            schemaJson.appearance.style.icon = icon
        }
        
        return appearance
    }

    /**
     * Get a rully resolveable path for a URL
     * 
     * Handle shortened paths:
     *  - `health/activity` -> `https://schemas.verida.io/health/activity/schema.json`
     *  - `https://schemas.verida.io/health/activity` -> `https://schemas.verida.io/health/activity/schema.json`
     *  - `/health/activity/test.json` -> `https://schemas.verida.io/health/activity/test.json`
     */
    protected async getPath(): Promise<string> {
        if (this.finalPath) {
            return this.finalPath
        }

        let path = this.path

        // If we have a full HTTP path, simply return it
        if (path.match("http")) {
            this.finalPath = await Schema.resolvePath(path)
            return this.finalPath
        }

        // Prepend `/` if required (ie: "profile/public")
        if (path.substring(1) != '/') {
            path = '/' + path
        }

        // Append /schema.json if required
        if (path.substring(path.length-5) != ".json") {
            path += "/schema.json"
        }

        this.finalPath = await Schema.resolvePath(path)
        this.path = this.finalPath
        return this.finalPath
    }

    /**
     * Force schema paths to be applied to URLs
     * 
     */
    static async resolvePath(uri: string): Promise<string> {
        const resolvePaths = Schema.schemaPaths!

        for (let searchPath in resolvePaths) {
            let resolvePath = resolvePaths[searchPath]
            if (uri.substring(0, searchPath.length) == searchPath) {
                uri = uri.replace(searchPath, resolvePath)
            }
        }

        return uri
    }

    /**
     * Load JSON from a url that is fully resolved.
     * 
     * Used by AJV.
     * 
     * @param {*} uri 
     */
    static async loadJson(uri: string): Promise<object> {
        if (jsonCache[uri]) {
            return jsonCache[uri]
        }
    
        jsonCache[uri] = new Promise(async (resolve, reject) => {
            uri = await Schema.resolvePath(uri)

            try {
                const request = await axios.get(uri, {
                    responseType: 'json'
                }) // @todo: check valid uri

                const json = await request.data
                resolve(json)
            } catch (err) {
                reject(err)
            }
            
        })
    
        return jsonCache[uri]
      }

}