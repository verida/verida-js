import _ from "lodash"
import didJWT from 'did-jwt'
import { box, randomBytes } from "tweetnacl"
import { Keyring } from '@verida/keyring'
import Datastore from "../../../datastore"
import Context from "../../../context"
import { MessageSendConfig, PermissionOptionsEnum } from "../../../interfaces"
import { base58ToBytes, bytesToBase58 } from "did-jwt/lib/util"

const VAULT_CONTEXT_NAME = 'Verida: Vault'

export default class VeridaOutbox {

    private accountDid: string
    private context: Context
    private contextName: string
    private keyring: Keyring
    private inboxes: any            // @todo, proper typing
    private outboxDatastore?: Datastore

    constructor(accountDid: string, context: Context, keyring: Keyring) {
        this.accountDid = accountDid
        this.context = context
        this.contextName = context.getContextName()
        this.keyring = keyring
        this.inboxes = {}
    }

    /**
     * Send a message to another user's application inbox. The message is converted to
     * a DID-JWT, signed by this application user (sender).
     *
     * The message is then encrypted using the recipients public key and saved
     * to their public inbox with date/time metadata removed.
     *
     * @param {string} did User's public DID
     * @param {string} type Type of inbox entry (ie: /schemas/base/inbox/type/dataSend)
     * @param {object} data Data to include in the message. Must match a particular
     *  schema or be an array of schema objects
     * @param {string} message Message to show the user describing the inbox message
     * @param {config} config Optional config (TBA). ie: specify `appName` if sending to a specific application
     */
    async send(did: string, type: string, data: object, message: string, config: MessageSendConfig = {}): Promise<object | null> {
        message = message ? message : ""
        config = config ? config : {}
        did = did.toLowerCase()

        const defaults: MessageSendConfig = {
            // By default send data to the user's official Verida Vault application
            recipientContextName: VAULT_CONTEXT_NAME
            // @todo: set a default expiry that is configurable but defaults to 24 hours?
        }
        config = _.merge(defaults, config)

        const sendingAppName = this.contextName
        const receivingAppName = config.recipientContextName

        this.validateData(type, data)

        const recipientContextConfig = await this.context.getContextConfig(did)
        if(!recipientContextConfig) {
            throw new Error(`Unable to locate DID: ${did}`)
        }

        const outboxEntry: any = {
            type: type,
            data: data,
            message: message,
            sentTo: did,
            sent: false
        }

        const outbox = await this.getOutboxDatastore()
        const response = await outbox.save(outboxEntry)

        if (!response) {
            console.error(outbox.errors)
            throw new Error("Unable to save to outbox. See error log above.")
        }

        if (response.ok !== true) {
            console.error(outbox.errors)
            throw new Error("Unable to save to outbox. See error log above.")
        }

        // Include the outbox _id and _rev so the recipient user
        // can respond to this inbox message
        outboxEntry._id = response.id
        outboxEntry._rev = response.rev

        /**
         * Sign this message from the current application user to create a JWT
         * containing the inbox message
         */
        // Use the current application's keyring as we can't request access to
        // the user's private vault
        const signer = await didJWT.EdDSASigner(this.keyring.signKeyPair!.secretKey)

        const jwt = await didJWT.createJWT({
            aud: this.accountDid,
            exp: config.expiry,
            data: outboxEntry,
            veridaApp: sendingAppName,
            insertedAt: (new Date()).toISOString()
        }, {
            alg: 'Ed25519',
            issuer: this.accountDid,
            signer
        })

        // Encrypt this message using the receipients public key and this apps private key
        const publicAsymKeyBase58 = recipientContextConfig.publicKeys.asymKey.base58
        const publicAsymKeyBytes = base58ToBytes(publicAsymKeyBase58)
        const sharedKey = box.before(publicAsymKeyBytes, this.keyring.asymKeyPair!.secretKey)
        const encrypted = this.keyring.asymEncrypt(jwt, sharedKey)

        // Save the encrypted JWT to the user's inbox
        const inbox = await this.getInboxDatastore(did, {
            contextName: receivingAppName
        })

        // Undo saving of inserted / modified metadata as this DB is public
        const db = await inbox.getDb()

        db.on("beforeInsert", function(data: any) {
            delete data['insertedAt']
            delete data['modifiedAt']
        })

        const inboxResponse = await inbox.save({
            content: encrypted,
            key: bytesToBase58(this.keyring.asymKeyPair!.publicKey)
        });

        // Update outbox entry as saved
        outboxEntry.sent = true
        await outbox.save(outboxEntry)

        return inboxResponse
    }

    /**
     * Get the inbox Datastore for a user by DID (and
     * optionally application name)
     *
     * @param {string} did User's public DID
     * @param {object} config Config to be passed to the dataserver
     */
    private async getInboxDatastore(did: string, config: MessageSendConfig = {}) {
        const cacheKey =  did + config.recipientContextName!
        if (this.inboxes[cacheKey]) {
            return this.inboxes[cacheKey]
        }

        // Build dataserver connecting to the recipient user's inbox
        const inbox = await this.context.openExternalDatastore("https://schemas.verida.io/inbox/item/schema.json", did, {
            permissions: {
                read: PermissionOptionsEnum.PUBLIC,
                write: PermissionOptionsEnum.PUBLIC
            }
        })
        
        /*let inbox = new Datastore(dataserver, "https://schemas.verida.io/inbox/item/schema.json", did, config.appName, {
            permissions: {
                read: "public",
                write: "public"
            },
            isOwner: false,
            // Sign data as this user and application
            signUser: this._app.user,
            signAppName: this._app.appName
        });*/

        this.inboxes[cacheKey] = inbox
        return inbox
    }

    private async getOutboxDatastore(): Promise<Datastore> {
        if (!this.outboxDatastore) {
            this.outboxDatastore = await this.context.openDatastore("https://schemas.verida.io/outbox/entry/schema.json")
        }

        return this.outboxDatastore
    }

    validateData(data: any): boolean {
        // TODO: Validate the data is a valid schema (or an array of valid schemas)
        return true
    }

}
