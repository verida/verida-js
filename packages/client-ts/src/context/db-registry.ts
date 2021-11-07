import { Context } from '..'
import Database from './database'
import Datastore from './datastore'
import { PermissionsConfig } from './interfaces'
const _ = require('lodash')
import EncryptionUtils from '@verida/encryption-utils'

export interface DbRegistryEntryEncryptionKey {
    key: string,
    type: string
}

export interface DbRegistryEntry {
    dbHash: string,
    dbName: string,
    endpointType: string,
    did: string,
    contextName: string,
    permissions: PermissionsConfig
    encryptionKey?: DbRegistryEntryEncryptionKey
}

/**
 * Maintain a registry of all databases owned by the current user
 * in a given context
 */
export default class DbRegistry {

    private context: Context
    private dbStore?: Datastore

    constructor(context: Context) {
        this.context = context
    }

    /**
     * 
     * @param {*} dbName 
     * @param {*} did 
     * @param {*} appName 
     * @param {*} permissions 
     * @param {*} encryptionKey Buffer representing the encryption key
     * @param {*} options 
     */
     public async saveDb(database: Database, checkPermissions: boolean = true) {
        await this.init()

        const dbEntry = await database.registryEntry()
        const databaseId = this.buildDatabaseId(dbEntry.dbName, dbEntry.did, dbEntry.contextName)

        const dbData: any = {
            _id: databaseId,
            ...dbEntry
        }

        delete dbData['id']
        const doc: any = await this.dbStore!.getOne({
            _id: databaseId
        })

        // Save if creating a new entry
        if (!doc) {
            const saved = await this.dbStore!.save(dbData, {
                forceInsert: true
            })

            if (!saved) {
                console.error(this.dbStore!.errors)
            }
            
            return
        }
        
        // Save if permissions have changed
        if(checkPermissions && !_.isEqual(dbData.permissions, doc.permissions)) {
            doc.permissions = dbData.permissions
            const saved = await this.dbStore!.save(doc)

            if (!saved) {
                console.error(this.dbStore!.errors)
            }

            return
        }
    }

    public async getMany(filter: any, options: any) {
        await this.init()

        return this.dbStore!.getMany(filter, options)
    }

    public async get(dbName: string, did: string, contextName: string): Promise<any> {
        await this.init()
        const dbId = this.buildDatabaseId(dbName, did, contextName)

        try {
            return await this.dbStore!.get(dbId)
        } catch (err: any) {
            if (err.reason == 'missing') {
                // may not be found
                return
            }

            throw err
        }
    }

    private buildDatabaseId(dbName: string, did: string, contextName: string): string {
        const text = [
            did.toLowerCase(),
            contextName,
            dbName
        ].join("/")

        return 'v' + EncryptionUtils.hash(text).substr(2)
    }

    /*
    @todo: Support updating permissions on a user database
    async updatePermissions(dbName, config) {
    }*/

    public async init() {
        if (this.dbStore) {
            return
        }
        
        this.dbStore = await this.context.openDatastore('https://core.schemas.verida.io/storage/database/v0.1.0/schema.json', {
            saveDatabase: false
        })
    }

}