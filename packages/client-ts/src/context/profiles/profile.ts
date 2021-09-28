const EventEmitter = require('events')
import Context from "../context"
import Datastore from "../datastore"
import { PermissionOptionsEnum } from "../interfaces"

interface ProfileDocument {
    _id: string,
    _rev?: string,
    key: string,
    value?: any
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
      await this.init()
      try {
        const response = await this.store!.get(key, options)
        if (!extended && response) {
          return response['value']
        }

        return response
      } catch (err: any) {
        if (err.error === 'not_found') {
          return
        }

        throw err
      }
    }

    /**
     *
     * @param {string} key Profile key to delete (ie: `email`)
     * @returns {boolean} Boolean indicating if the delete was successful
     */
    public async delete(key: string): Promise<void> {
      await this.init()
      return this.store!.delete(key)
    }

    /**
     * Get many profile values.
     *
     * @param filter
     * @param {object} [options] Database options that will be passed through to [PouchDB.find()](https://pouchdb.com/api.html#query_index)
     */
    public async getMany(filter: any, options: any): Promise<any> {
      await this.init();
      return this.store!.getMany(filter, options)
    }

    /**
       * Set a profile value by key
       *
       * @param {string|object} doc Profile key to set (ie: `email`) **OR** an existing profile document obtained from `get()` or getMany()`.
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
    public async set(doc: ProfileDocument | string, value: any): Promise<any> {
        await this.init()

        let profileData: ProfileDocument = typeof doc === 'string' ? {
          _id: doc,
          key: doc
        } : doc

        // Try to find the original document and do an update if it exists
        if (profileData._rev === undefined) {
            try {
              const oldDoc = await this.get(profileData._id, {}, true)
              if (oldDoc) {
                  profileData = oldDoc
              }
            } catch (err) {
              console.log(err)
              // not found, so let the insert continue
            }
        }

        profileData.value = value
        const success = this.store!.save(profileData)
        if (!success) {
          this.errors = this.store!.errors
        }

        return success
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

    private async init() {
        if (!this.store) {
          const permissions = {
            read: this.isPrivate ? PermissionOptionsEnum.OWNER : PermissionOptionsEnum.PUBLIC,
            write: PermissionOptionsEnum.OWNER
          }

          if (this.writeAccess) {
            this.store = await this.context.openDatastore('https://schemas.verida.io/profile/' + this.profileName + '/schema.json', {
              permissions,
            })
          } else {
            this.store = await this.context.openExternalDatastore('https://schemas.verida.io/profile/' + this.profileName + '/schema.json', this.did, {
              permissions,
              readOnly: true
            })
          }

          // Attempt to fetch a record to ensure the database is created if it didn't already exist
          try {
            await this.get('')
          } catch (err: any) {}
        }
    }
  }
