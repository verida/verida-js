const EventEmitter = require('events')
import Context from "../context"
import Datastore from "../datastore"
import { PermissionOptionsEnum } from "../interfaces"

interface ProfileDocument {
  _id: string,
  [key: string]: string
}

/**
 * A key/value profile datastore for a user
 */
export class Profile extends EventEmitter {
    
    private context: Context
    private did: string
    
    private profileName: string
    private store?: Datastore

    private writeAccess: boolean
    private isPrivate: boolean
    
    public errors: object
    /**
       * Create a new user profile.
       *
       * **Do not instantiate directly.**
       *
       * Access the current user's profile via {@link App.profile}
       *
       * @constructor
       */
    constructor (context: Context, did: string, profileName: string, writeAccess: boolean, isPrivate: boolean = false) {
      super()
      this.context = context
      this.profileName = profileName
      this.did = did
      this.writeAccess = writeAccess
      this.isPrivate = isPrivate
      this.errors = []
    }

    /**
     * Get a profile value by key
     *
     * @param {string} key Profile key to get (ie: `email`)
     * @param options
     * @param extended
     * @example
     * let emailDoc = app.wallet.profile.get('email');
     *
     * // key = email
     * // value = john@doe.com
     * console.log(emailDoc.key, emailDoc.value);
     * @return {object} Database record for this profile key. Object has keys [`key`, `value`, `_id`, `_rev`].
     */
    public async get(key: string, options?: any, extended: boolean = false): Promise<any | undefined> {
      const record = await this.getRecord()
      if (record && typeof(record[key]) !== 'undefined') {
        return record[key]
      }
    }

    /**
     *
     * @param {string} key Profile key to delete (ie: `email`)
     * @returns {boolean} Boolean indicating if the delete was successful
     */
    public async delete(key: string): Promise<boolean> {
      const record = await this.getRecord()
      if (!record || record[key] == 'undefined') {
        return false
      }

      delete record[key]
      return await this.saveRecord(record)
    }

    /**
     * Get many profile values.
     *
     * @param filter
     * @param {object} [options] Database options that will be passed through to [PouchDB.find()](https://pouchdb.com/api.html#query_index)
     */
    public async getMany(filter: any, options: any): Promise<any> {
      return this.getRecord()
    }

    /**
       * Set a profile value by key
       *
       * @param {string} key Profile key to set (ie: `email`)
       * @param {*} value Value to save
       * @example
       * // Set a profile value by key
       * app.wallet.profile.set('name', 'John');
       *
       * // Update a profile value from an existing document
       * let emailDoc = app.wallet.profile.get('email');
       * app.wallet.profile.set(emailDoc, 'john@doe.com');
       *
       * // Update a profile profile by key
       * app.wallet.profile.set('email', 'john@doe.com');
       * @returns {boolean} Boolean indicating if the save was successful
       */
    public async set(key: string, value: any): Promise<any> {
      const record = await this.getRecord()
      record[key] = value
      return await this.saveRecord(record)
    }

    /**
     * Listen for changes to the public profile
     */
    public async listen(callback: any): Promise<any> {
        await this.init()

        const profile = this
        const cb = async function (info: any) {
            const row = await profile.get(info.id, {
                rev: info.changes[0].rev
            })
            callback(row)
        }

        await this.store!.changes(cb)
    }

    private async getRecord(): Promise<ProfileDocument> {
      await this.init()
      try {
        const record = await this.store!.get(this.profileName)
        return record
      } catch (err: any) {
        if (err.reason == 'missing') {
          return {
            _id: this.profileName
          }
        }

        throw err
      }
    }

    private async saveRecord(record: object): Promise<boolean> {
      await this.init()
      const success = await this.store!.save(record)

      if (!success) {
        this.errors = this.store!.errors
      }

      return success ? true : false
    }

    private async init() {
        if (!this.store) {
          const permissions = {
            read: this.isPrivate ? PermissionOptionsEnum.OWNER : PermissionOptionsEnum.PUBLIC,
            write: PermissionOptionsEnum.OWNER
          }

          const schemaUri = 'https://common.schemas.verida.io/profile/' + this.profileName + '/v0.1.0/schema.json'

          if (this.writeAccess) {
            this.store = await this.context.openDatastore(schemaUri, {
              permissions,
            })
          } else {
            this.store = await this.context.openExternalDatastore(schemaUri, this.did, {
              permissions,
              readOnly: true
            })
          }

          // Attempt to fetch a record to ensure the database is created if it didn't already exist
          try {
            await this.get('')
          } catch (err: any) {
            if (err.response && err.response.status == 403) {
              throw new Error(`Schema URI not found: ${schemaUri}`)
            }

            // The profile may not exist yet
            if (err.reason != 'missing') {
              throw err
            }
          }
        }
    }
  }
