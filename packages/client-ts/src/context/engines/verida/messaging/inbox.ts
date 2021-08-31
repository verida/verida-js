import { box } from "tweetnacl"
const didJWT = require("did-jwt")
const EventEmitter = require("events")
const bs58 = require('bs58')

import { Keyring } from '@verida/keyring'
import { PermissionOptionsEnum } from '../../../interfaces'
import Context from "../../../context"

export default class VeridaInbox extends EventEmitter {

    private context: Context
    private keyring: Keyring
    private initComplete: boolean

    private privateInbox?: any
    private publicInbox?: any

    protected maxItems: Number

    constructor(context: Context, keyring: Keyring, maxItems: Number = 50) {
        super()
        this.context = context
        this.keyring = keyring
        this.initComplete = false

        // Maximum length of inbox items to retain
        this.maxItems = maxItems
    }

    async processAll() {
        await this.init()

        const items = await this.publicInbox.getMany()
        if (!items || items.length == 0) {
            return 0
        }

        const inbox = this
        let count = 0
        items.forEach((item: object) => {
            inbox.processItem(item)
            count++
        });

        return count
    }

    async processItem(inboxItem: any) {
        await this.init()
        
        // Build the shared key using this user's private asymmetric key
        // and the user supplied public key
        const keys = await this.keyring.getKeys()
        let publicKeyBytes = bs58.decode(inboxItem.key)
        let sharedKeyEnd = box.before(publicKeyBytes, keys.asymPrivateKey)

        // Decrypt the inbox/tem to obtain the JWT
        let jwt;
        try {
            jwt = await this.keyring.asymDecrypt(inboxItem.content, sharedKeyEnd)
        } catch (err) {
            console.error("Unable to decrypt inbox item:")
            console.error(err)
            return
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
            await this.privateInbox.save(inboxEntry)
        } catch (err) { 
            console.error("Unable to save to private inbox")
            console.error(err)
        }

        try {
            // delete the inbox/item
            await this.publicInbox.delete(inboxItem);
        } catch (err) { 
            console.error("Unable to delete from public inbox")
            console.error(err)
            throw err
        }

        this.emit("newMessage", inboxEntry)
        this._gc()
    }

    public async getItem(itemId: string, options: any) {
        await this.init()
        return this.publicInbox.get(itemId, options)
    }

    public async watch() {
        await this.init()
        let inbox = this // Setup watching for new inbox items in the public inbox

        const publicDb = await this.publicInbox.getDb()
        const dbInstance = await publicDb.getDb()
        dbInstance.changes({
            since: 'now',
            live: true
        }).on('change', async function (info: any) {
            if (info.deleted) {
                // ignore deleted changes
                return
            }

            const inboxItem = await inbox.getItem(info.id, {
                rev: info.changes[0].rev
            })
            await inbox.processItem(inboxItem)
        }).on('denied', function(err: any) {
            console.error('Inbox sync denied')
            console.error(err)
        }).on('error', function (err: any) {
            //console.log("Error watching for private inbox changes")
            //console.log(err)
            // This often happens when changing networks, so don't log
            setTimeout(() => {
                console.log('Retrying to establish public inbox connection')
                inbox.watch()
            }, 10000)
            
        }); // Setup watching for any changes to the local private inbox (ie: marking an item as read)
    }

    public async watchPrivateChanges() {
        let inbox = this
        const privateDb = await this.privateInbox.getDb()
        const dbInstance = await privateDb.getDb()
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
                console.log('Retrying to establish private inbox connection')
                inbox.watchPrivateChanges()
            }, 10000)
        });
    }

    /**
     * Initialise the inbox manager
     */
    public async init() {
        if (this.initComplete) {
            return
        }

        this.initComplete = true
        this.publicInbox = await this.context.openDatastore("https://schemas.verida.io/inbox/item/schema.json", {
            permissions: {
                read: PermissionOptionsEnum.PUBLIC,
                write: PermissionOptionsEnum.PUBLIC
            }
        })
        
        this.privateInbox = await this.context.openDatastore("https://schemas.verida.io/inbox/entry/schema.json", {
            permissions: {
                read: PermissionOptionsEnum.OWNER,
                write: PermissionOptionsEnum.OWNER
            }
        })

        await this.watchPrivateChanges()
        await this.watch()
        await this.processAll()
    }

    async getInboxDatastore() {
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