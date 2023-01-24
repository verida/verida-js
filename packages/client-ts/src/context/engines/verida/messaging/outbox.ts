const _ = require("lodash");
const didJWT = require("did-jwt");
import { box } from "tweetnacl";
import { Keyring } from "@verida/keyring";
import Datastore from "../../../datastore";
import DIDContextManager from "../../../../did-context-manager";
import Context from "../../../context";
import EncryptionUtils from "@verida/encryption-utils";
import { DatabasePermissionOptionsEnum, MessageSendConfig } from "@verida/types";

const VAULT_CONTEXT_NAME = "Verida: Vault";

/**
 * @category
 * Modules
 */
class VeridaOutbox {
  private accountDid: string;
  private contextName: string;
  private keyring: Keyring;
  private outboxDatastore: Datastore;
  private context: Context;
  private didContextManager: DIDContextManager;

  private inboxes: any; // @todo, proper typing

  constructor(
    contextName: string,
    accountDid: string,
    keyring: Keyring,
    outboxDatastore: Datastore,
    context: Context,
    didContextManager: DIDContextManager
  ) {
    this.contextName = contextName;
    this.accountDid = accountDid;
    this.keyring = keyring;
    this.outboxDatastore = outboxDatastore;
    this.context = context;
    this.didContextManager = didContextManager;

    this.inboxes = {};
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
  public async send(
    did: string,
    type: string,
    data: object,
    message: string,
    config: MessageSendConfig
  ): Promise<object | null> {
    message = message ? message : "";
    did = did.toLowerCase();

    const defaults: MessageSendConfig = {
      did: did,
      // By default send data to the user's official Verida Vault application
      recipientContextName: VAULT_CONTEXT_NAME,
      // @todo: set a default expiry that is configurable but defaults to 24 hours?
      // Fix in :- https://github.com/verida/verida-js/issues/131.
    };
    // Should refactor this logic
    config = _.merge(defaults, config);

    const sendingContextName = this.contextName;
    const receivingContextName = config.recipientContextName!;

    this.validateData(type, data);

    // Need to locate the context config for a given DID so we can locate their inbox
    let recipientContextConfig;
    try {
      recipientContextConfig = await this.didContextManager.getDIDContextConfig(
        did,
        receivingContextName,
        false
      );
    } catch (err) {
      throw new Error(
        `Unable to send message. Recipient does not have an inbox for that context (${receivingContextName})`
      );
    }

    const outboxEntry: any = {
      type: type,
      data: data,
      message: message,
      sentTo: did,
      sent: false,
    };

    if (config.openUrl) {
      outboxEntry.openUrl = config.openUrl
    }

    const outbox = this.outboxDatastore;
    const response: any = await outbox.save(outboxEntry);

    if (!response) {
      console.error(outbox.errors);
      throw new Error("Unable to save to outbox. See error log above.");
    }

    if (response.ok !== true) {
      console.error(outbox.errors);
      throw new Error("Unable to save to outbox. See error log above.");
    }

    // Include the outbox _id and _rev so the recipient user
    // can respond to this inbox message
    outboxEntry._id = response.id;
    outboxEntry._rev = response.rev;

    /**
     * Sign this message from the current application user to create a JWT
     * containing the inbox message
     */
    // Use the current application's keyring as we can't request access to
    // the user's private vault
    const keys = await this.keyring.getKeys();
    const signer = await didJWT.ES256KSigner(keys.signPrivateKey);

    const jwt = await didJWT.createJWT(
      {
        aud: this.accountDid,
        exp: config.expiry,
        data: outboxEntry,
        context: sendingContextName,
        insertedAt: new Date().toISOString(),
      },
      {
        alg: "ES256K",
        issuer: this.accountDid,
        signer,
      }
    );

    // Encrypt this message using the receipients public key and this apps private key
    const publicAsymKey =
      recipientContextConfig.publicKeys.asymKey.publicKeyHex;
    const publicAsymKeyBytes = EncryptionUtils.hexToBytes(publicAsymKey);
    const sharedKey = box.before(publicAsymKeyBytes, keys.asymPrivateKey);
    const encrypted = await this.keyring.asymEncrypt(jwt, sharedKey);

    // Save the encrypted JWT to the user's inbox
    const inbox = await this.getInboxDatastore(did, {
      recipientContextName: receivingContextName,
      did: did
    });

    // Undo saving of inserted / modified metadata as this DB is public
    const db = await inbox.getDb();

    db.on("beforeInsert", function (data: any) {
      delete data["insertedAt"];
      delete data["modifiedAt"];
    });

    const inboxBody = {
      content: encrypted,
      key: EncryptionUtils.bytesToHex(keys.asymPublicKey),
    };

    const inboxResponse = await inbox.save(inboxBody);
    if (!inboxResponse) {
      throw new Error(`Unable to write to user's inbox`);
    }

    // Update outbox entry as saved
    outboxEntry.sent = true;
    const outboxResponse = await outbox.save(outboxEntry);

    return inboxResponse;
  }

  /**
   * Get the inbox Datastore for a user by DID (and
   * optionally application name)
   *
   * @param {string} did User's public DID
   * @param {object} config Config to be passed to the dataserver
   */
  private async getInboxDatastore(did: string, config: MessageSendConfig) {
    const cacheKey = did + config.recipientContextName!;
    if (this.inboxes[cacheKey]) {
      return this.inboxes[cacheKey];
    }

    /**
     * Open a database owned by any user
     */
    const inbox = await this.context!.openExternalDatastore(
      "https://core.schemas.verida.io/inbox/item/v0.1.0/schema.json",
      did,
      {
        permissions: {
          read: DatabasePermissionOptionsEnum.PUBLIC,
          write: DatabasePermissionOptionsEnum.PUBLIC,
        },
        contextName: config.recipientContextName!,
      }
    );

    this.inboxes[cacheKey] = inbox;
    return inbox;
  }

  validateData(type: string, data: any): boolean {
    // TODO: Validate the data is a valid schema (or an array of valid schemas)
    return true;
  }
}

export default VeridaOutbox;
