import { box } from "tweetnacl"
const didJWT = require("did-jwt")
const EventEmitter = require("events")

import { Keyring } from '@verida/keyring'
import { PermissionOptionsEnum } from '../../../interfaces'
import StorageEngineVerida from '../database/engine'

export default class VeridaInbox extends EventEmitter {

    private dbEngine: StorageEngineVerida
    private keyring: Keyring
    private initComplete: boolean

    private privateInbox?: any
    private publicInbox?: any

    protected maxItems: Number

    constructor(dbEngine: StorageEngineVerida, keyring: Keyring, maxItems: Number = 50) {
        super()
        this.dbEngine = dbEngine
        this.keyring = keyring
        this.initComplete = false

        // Maximum length of inbox items to retain
        this.maxItems = maxItems
    }

    async processAll() {
        await this.init()
        
        let items = await this.publicInbox.getMany()
        if (!items || items.length == 0) {
            return 0
        }

        let manager = this;
        let count = 0
        items.forEach((item: object) => {
            manager.processItem(item)
            count++
        });

        return count
    }

    async processItem(inboxItem: any) {
        await this.init()
        
        // Build the shared key using this user's private asymmetric key
        // and the user supplied public key
        let publicKeyBytes = Buffer.from(inboxItem.key.slice(2), 'hex')
        let sharedKeyEnd = box.before(publicKeyBytes, this.keyring.asymKeyPair!.secretKey)

        // Decrypt the inbox/tem to obtain the JWT
        let jwt;
        try {
            jwt = this.keyring.asymDecrypt(inboxItem.content, sharedKeyEnd)
        } catch (err) {
            console.error("Unable to decrypt inbox item:")
            console.error(err)
            return;
        }

        let decoded = didJWT.decodeJWT(jwt)
        let item = decoded.payload

        // TODO: Verify the DID-JWT with a custom VID resolver

        let inboxEntry = {
            _id: inboxItem._id, // Use the same _id to avoid duplicates
            message: item.data.message,
            type: item.data.type,
            sentAt: item.insertedAt,
            data: item.data.data,
            sentBy: {
                did: item.aud,
                vid: item.vid,
                app: item.veridaApp
            },
            insertedAt: (new Date()).toISOString(),
            read: false
        }

        // Save a new inbox entry into the user's private inbox
        try {
            await this._privateInbox.save(inboxEntry)
        } catch (err) { 
            console.error("Unable to save to private inbox")
            console.error(err)
        }

        try {
            // delete the inbox/item
            await this._publicInbox.delete(inboxItem);
        } catch (err) { 
            console.error("Unable to delete from public inbox")
            console.error(err)
            throw err
        }

        await this._gc();
        this.emit("newMessage", inboxEntry)
    }

    async watch() {
        await this.init()
        let inbox = this // Setup watching for new inbox items in the public inbox

        const publicDb = await this.publicInbox.getDb()
        const dbInstance = await publicDb.getInstance()
        dbInstance.changes({
            since: 'now',
            live: true
        }).on('change', async function (info: any) {
            if (info.deleted) {
                // ignore deleted changes
                return
            }

            const inboxItem = await publicDb.get(info.id, {
                rev: info.changes[0].rev
            });
            await inbox.processItem(inboxItem)
        }).on('denied', function(err: any) {
            console.error('Inbox sync denied')
            console.error(err)
        }).on('error', function (err: any) {
            //console.error("Error watching for public inbox changes");
            // This often happens when changing networks, so don't log
        }); // Setup watching for any changes to the local private inbox (ie: marking an item as read)

        await this.watchPrivateChanges()
    }

    async watchPrivateChanges() {
        let inbox = this
        const privateDb = await this.privateInbox.getDb()
        const dbInstance = await privateDb.getInstance()
        dbInstance.changes({
            since: 'now',
            live: true
        }).on('change', async function (info: any) {
            const inboxItem = await privateDb.get(info.id, {
                rev: info.changes[0].rev
            })
            inbox.emit("inboxChange", inboxItem)
        }).on('error', function (err: any) {
            console.log("Error watching for private inbox changes")
            console.log(err)
            setTimeout(() => {
                console.log('retrying to establish inbox connection')
                inbox.watchPrivateChanges()
            }, 10000)
        });
    }

    /**
     * Initialise the inbox manager
     */
    async init() {
        if (this.initComplete) {
            return
        }

        this.initComplete = true
        this.publicInbox = await this.dbEngine.openDatastore("https://schemas.verida.io/inbox/item/schema.json", {
            permissions: {
                read: PermissionOptionsEnum.PUBLIC,
                write: PermissionOptionsEnum.PUBLIC
            }
        })
        
        this.privateInbox = await this.dbEngine.openDatastore("https://schemas.verida.io/inbox/entry/schema.json", {
            permissions: {
                read: PermissionOptionsEnum.OWNER,
                write: PermissionOptionsEnum.OWNER
            }
        })

        await this.watch()
        await this.processAll()
    }

    async getInbox() {
        await this.init()
        return this.privateInbox
    }

    /**
     * Garbage collection. Remove inbox items past the max limit.
     */
    async _gc() {
        await this.init()
        const privateInbox = this.privateInbox
        
        const items = await privateInbox.getMany({
            read: true                  // Only delete read inbox items
        }, {
            skip: this._maxItems,
            sort: [{ sentAt: 'desc' }]  // Delete oldest first
        })

        if (items && items.length) {
            items.forEach(async (item: object) =>  {
                await privateInbox.delete(item)
            });
        }
    }

}