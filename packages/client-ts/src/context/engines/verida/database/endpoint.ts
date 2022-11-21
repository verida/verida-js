import { EventEmitter } from 'events'
import DatastoreServerClient from './client'
import { ServiceEndpoint } from 'did-resolver'
import { Account, AuthContext, VeridaDatabaseAuthContext, VeridaDatabaseAuthTypeConfig } from '@verida/account'
import EncryptionUtils from '@verida/encryption-utils'
import { Interfaces } from '@verida/storage-link'
import { PermissionsConfig } from "../../../interfaces";
import Utils from "./utils";

export default class Endpoint extends EventEmitter {

    private contextName: string
    private endpointUri: ServiceEndpoint
    private client: DatastoreServerClient
    private contextConfig: Interfaces.SecureContextConfig

    private account?: Account
    private auth?: VeridaDatabaseAuthContext

    private db?: any

    constructor(contextName: string, contextConfig: Interfaces.SecureContextConfig, endpointUri: ServiceEndpoint) {
        super()

        this.contextName = contextName
        this.endpointUri = endpointUri
        this.contextConfig = contextConfig

        this.client = new DatastoreServerClient(
            contextName,
            endpointUri
        );
    }

    public async setUsePublic() {
        const response = await this.client.getPublicUser();
        this.endpointUri = response.data.user.dsn
    }

    public toString() {
        return this.endpointUri
    }

    public async connectAccount(account: Account) {
        this.account = account
        // @todo: is this needed or not? if we do this, then we will always auth with public databases
        await this.authenticate(true)
    }

    public async connectDb(did: string, databaseName: string, permissions: PermissionsConfig, isOwner: boolean) {
        if (this.db) {
            return;
        }

        const dbConfig: any = {
            skip_setup: true,
        }

        const databaseHash = this.buildDatabaseHash(databaseName, did);

        if (this.auth) {
            const instance = this
            dbConfig['fetch'] = async function (url: string, opts: any) {
                opts.headers.set('Authorization', `Bearer ${instance.getAccessToken()}`)
                const result = await PouchDB.fetch(url, opts)
                if (result.status == 401) {
                    // Unauthorized, most likely due to an invalid access token
                    // Fetch new credentials and try again
                    await instance.authenticate(isOwner)

                    opts.headers.set('Authorization', `Bearer ${instance.getAccessToken()}`)
                    const result = await PouchDB.fetch(url, opts)

                    if (result.status == 401) {
                        throw new Error(`Permission denied to access server: ${this.dsn}`)
                    }

                    // Return an authorized result
                    return result
                }

                // Return an authorized result
                return result
            }
        }

        this.db = new PouchDB(`${this.endpointUri}/${databaseHash}`, dbConfig);

        try {
            let info = await this.db.info();
            if (info.error && info.error == "not_found") {
                if (isOwner) {
                    await this.createDb(databaseName, did, permissions);
                } else {
                    throw new Error(`Database not found: ${databaseName}`);
                }
            }

            if (info && info.error == "forbidden") {
                throw new Error(`Permission denied to access remote database.`);
            }
        } catch (err: any) {
            if (isOwner) {
                await this.createDb(databaseName, did, permissions);
            } else {
                throw new Error(`Database not found: ${databaseName}`);
            }
        }

        return this.db
    }

    /**
     * Re-authenticate this endpoint and update the credentials
     * for the database.
     * 
     * This is called by the internal fetch() methods when they detect an invalid access token
     * 
     * @ todo: redo
     */
    public async authenticate(isOwner: boolean/*db: BaseDb*/) {
        if (!this.account) {
            // No account connected, so can't reconnect database
            throw new Error(`Unable to connect to ${this.endpointUri}. Access token has expired and unable to refresh as no account is connected.`)
        }

        /**
         * We could be connecting to:
         * - A database we own
         *  - Need to connect using our dsn (this.dsn)
         * - An database owned by another user
         *  - Need to connect to the user's database server
         *  - Need to authenticate as ourselves
         *  - Need to talk to the db hash for the did that owns the database
         */

        if (!isOwner && this.account) {
            this.auth = await this.buildExternalAuth();
            // is this needed? await this.client.setAuthContext(this.auth)
            return
        }

        let auth: AuthContext
        try {
            // Attempt to re-authenticate using the refresh token and ignoring the access token (its invalid)
            auth = await this.account!.getAuthContext(this.contextName, this.contextConfig, this.endpointUri, <VeridaDatabaseAuthTypeConfig>{
                invalidAccessToken: true
            })
        } catch (err: any) {
            if (err.name == 'ContextAuthorizationError') {
                // The refresh token is invalid
                // Force a new connection, this will cause a new single sign in popup if in a web environment
                // and using account-web-vault
                auth = await this.account!.getAuthContext(this.contextName, this.contextConfig, this.endpointUri, <VeridaDatabaseAuthTypeConfig>{
                    force: true
                })
            } else {
                throw err
            }
        }

        this.auth = <VeridaDatabaseAuthContext>auth
        await this.client.setAuthContext(this.auth)
    }

    public async setAuth(auth: VeridaDatabaseAuthContext) {
        this.auth = auth
    }

    public async getAccessToken() {
        return this.auth!.accessToken!
    }

    public async setAuthContext(authContext: VeridaDatabaseAuthContext): Promise<void> {
        this.client.setAuthContext(authContext)
    }

    public async createDb(databaseName: string, did: string, permissions: PermissionsConfig,) {
        const options = {
            permissions
        };

        try {
            await this.client.createDatabase(did, databaseName, options);
            // There's an odd timing issue that needs a deeper investigation
            await Utils.sleep(1000);
        } catch (err) {
            throw new Error("User doesn't exist or unable to create user database");
        }
    }

    // DID + context name + DB Name + readPerm + writePerm
    private buildDatabaseHash(databaseName: string, did: string) {
        let text = [
            did.toLowerCase(),
            this.contextName,
            databaseName,
        ].join("/");

        const hash = EncryptionUtils.hash(text).substring(2);

        // Database name in CouchDB must start with a letter, so prepend a `v`
        return "v" + hash;
    }

  /**
   * When connecting to a CouchDB server for an external user, the current user may not
   * have access to read/write.
   *
   * Take the external user's `endpointUri` that points to their CouchDB server. Establish
   * a connection to the Verida Middleware (DatastoreServerClient) as the current user
   * (accountDid) and create a new account if required.
   *
   * Return the current user's DSN which provides authenticated access to the external
   * user's CouchDB server for the current user.
   *
   * @returns {string}
   */
    protected async buildExternalAuth(): Promise<VeridaDatabaseAuthContext> {
        if (!this.account) {
            throw new Error('Unable to connect to external storage node. No account connected.')
        }

        const auth = await this.account!.getAuthContext(this.contextName, this.contextConfig, this.endpointUri, <VeridaDatabaseAuthTypeConfig>{
            endpointUri: this.endpointUri
        })

        return <VeridaDatabaseAuthContext> auth

        /*const client = new DatastoreServerClient(this.storageContext, this.contextConfig);
        await client.setAccount(this.account!);
    
        const auth = await client.getContextAuth();
        return auth*/
    }

    public logout() {
        this.client = new DatastoreServerClient(
            this.contextName,
            this.endpointUri
        );
    }

    public getDb() {
        return this.db
    }

}