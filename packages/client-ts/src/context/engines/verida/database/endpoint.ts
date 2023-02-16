import { EventEmitter } from 'events'
import DatastoreServerClient from './client'
import { ServiceEndpoint } from 'did-resolver'
import { Account } from '@verida/account'
import StorageEngineVerida from './engine'
import Utils from "./utils";

import * as PouchDBFind from "pouchdb-find";
import * as PouchDBLib from "pouchdb";
import { AuthContext, DatabasePermissionsConfig, EndpointUsage, SecureContextConfig, VeridaDatabaseAuthContext, VeridaDatabaseAuthTypeConfig, DatabasePermissionOptionsEnum } from '@verida/types'

// See https://github.com/pouchdb/pouchdb/issues/6862
const { default: PouchDB } = PouchDBLib as any;

PouchDB.plugin(PouchDBFind);

/**
 * @emits EndpointWarning
 */
export default class Endpoint extends EventEmitter {

    private contextName: string
    private endpointUri: ServiceEndpoint
    private client: DatastoreServerClient
    private contextConfig: SecureContextConfig
    private storageEngine: StorageEngineVerida

    private account?: Account
    private auth?: VeridaDatabaseAuthContext
    private couchDbHost?: string
    private usePublic: boolean = false
    private databases: Record<string, any> = {}

    constructor(storageEngine: StorageEngineVerida, contextName: string, contextConfig: SecureContextConfig, endpointUri: ServiceEndpoint) {
        super()

        this.storageEngine = storageEngine
        this.contextName = contextName
        this.endpointUri = endpointUri
        this.contextConfig = contextConfig

        this.client = new DatastoreServerClient(
            this,
            contextName,
            endpointUri
        );
    }

    public async setUsePublic() {
        const response = await this.client.getPublicUser();
        this.couchDbHost = response.data.user.dsn
        this.usePublic = true
    }

    public toString(): string {
        return <string> this.endpointUri
    }

    public async connectAccount(account: Account, isOwner: boolean = true) {
        this.account = account
        // @todo: is this needed or not? if we do this, then we will always auth with public databases
        await this.authenticate(isOwner)
    }

    public async connectDb(did: string, databaseName: string, permissions: DatabasePermissionsConfig, isOwner: boolean) {
        const databaseHash = Utils.buildDatabaseHash(databaseName, this.contextName, did);
        //console.log(`connectDb(${databaseName} / ${databaseHash} / ${this.endpointUri})`)
        if (this.databases[databaseHash]) {
            return this.databases[databaseHash];
        }

        if (!this.couchDbHost) {
            throw new Error(`Unable to connect to database (${databaseName}). No CouchDB host.`)
        }

        const dbConfig: any = {
            skip_setup: true
        }

        const isPublicWrite = (permissions.write == DatabasePermissionOptionsEnum.PUBLIC)

        if (this.auth && !this.usePublic) {
            const instance = this
            dbConfig['fetch'] = async function (url: string, opts: any) {
                let accessToken = await instance.getAccessToken()
                opts.headers.set('Authorization', `Bearer ${accessToken}`)
                let result = await PouchDB.fetch(url, opts)
                if (result.status == 401) {
                    // Unauthorized, most likely due to an invalid access token
                    // Fetch new credentials and try again
                    await instance.authenticate(isOwner)

                    accessToken = await instance.getAccessToken()
                    opts.headers.set('Authorization', `Bearer ${accessToken}`)

                    result = await PouchDB.fetch(url, opts)

                    // Ping database to ensure replication is active
                    // No need to await
                    // Retry if auth error if we are the database owner
                    instance.client.pingDatabases([databaseHash], isPublicWrite, did, instance.contextName, isOwner)

                    if (result.status == 401) {
                        throw new Error(`Permission denied to access server: ${instance.toString()}`)
                    }

                    // Return an authorized result
                    return result
                }

                // Return an authorized result
                return result
            }
        }

        const db = new PouchDB(`${this.couchDbHost!}/${databaseHash}`, dbConfig);

        try {
            let info = await db.info();
            if (info.error && info.error == "not_found") {
                if (isOwner) {
                    await this.storageEngine.createDb(databaseName, did, permissions)
                } else {
                    throw new Error(`Database not found: ${databaseName} / ${databaseHash}`);
                }
            }

            if (info && info.error == "forbidden") {
                throw new Error(`Permission denied to access remote database.`);
            }
        } catch (err: any) {
            if (isOwner) {
                await this.storageEngine.createDb(databaseName, did, permissions)
            } else {
                throw new Error(`Database (${databaseName} / ${databaseHash}) not found on ${this.endpointUri}: ${err.message}`);
            }
        }

        this.databases[databaseHash] = db

        // Ping database to ensure replication is active
        // No need to await
        // Retry if auth error if we are the database owner
        this.client.pingDatabases([databaseHash], isPublicWrite, did, this.contextName, isOwner)
        return db
    }

    public async disconnectDatabase(did: string, databaseName: string) {
        const databaseHash = Utils.buildDatabaseHash(databaseName, this.contextName, did);
        if (this.databases[databaseHash]) {
            delete this.databases[databaseHash]
        }
    }

    /**
     * Re-authenticate this endpoint and update the credentials
     * for the database.
     * 
     * This is called by the internal fetch() methods when they detect an invalid access token
     * 
     * @ todo: redo
     */
    public async authenticate(isOwner: boolean) {
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
            await this.client.setAuthContext(this.auth)
            this.couchDbHost = this.auth.host
            return
        }

        let auth: AuthContext
        try {
            //const now = (new Date()).getTime()
            // Attempt to re-authenticate using the refresh token and ignoring the access token (its invalid)
            auth = await this.account!.getAuthContext(this.contextName, this.contextConfig, <VeridaDatabaseAuthTypeConfig>{
                endpointUri: this.endpointUri,
                invalidAccessToken: true
            })
            //console.log(`endpoint.getAuthContext(${this.endpointUri}): ${(new Date()).getTime()-now}`)
        } catch (err: any) {
            if (err.name == 'ContextAuthorizationError') {
                // The refresh token is invalid
                // Force a new connection, this will cause a new single sign in popup if in a web environment
                // and using account-web-vault
                auth = await this.account!.getAuthContext(this.contextName, this.contextConfig, <VeridaDatabaseAuthTypeConfig>{
                    endpointUri: this.endpointUri,
                    force: true
                })
            } else {
                throw err
            }
        }

        this.auth = <VeridaDatabaseAuthContext>auth
        await this.client.setAuthContext(this.auth)
        this.couchDbHost = this.auth.host
    }

    public async setAuth(auth: VeridaDatabaseAuthContext) {
        this.auth = auth
        await this.client.setAuthContext(this.auth)
    }

    public async getStatus() {
        return this.client.getStatus()
    }

    public async getAccessToken() {
        return this.auth!.accessToken!
    }

    public async setAuthContext(authContext: VeridaDatabaseAuthContext): Promise<void> {
        this.client.setAuthContext(authContext)
    }

    public async createDb(databaseName: string, permissions: DatabasePermissionsConfig, retry: boolean) {
        const options = {
            permissions
        };

        try {
            await this.client.createDatabase(databaseName, options, retry);
            // There's an odd timing issue that needs a deeper investigation
            await Utils.sleep(1000);
        } catch (err) {
            throw new Error(`User doesn't exist or unable to create user database (${databaseName} / ${this.endpointUri})`);
        }
    }

    public async updateDatabase(databaseName: string, options: any): Promise<void> {
        try {
            await this.client.updateDatabase(databaseName, options)
        }
        catch (err: any) {
            let message = err.message
            if (err.response && err.response.data && err.response.data.message) {
                message = err.response.data.message
            }

            throw new Error(`Unable to update database configuration (${databaseName}): ${message}`);
        }

        await this.storageEngine.checkReplication()
    }

    public async deleteDatabase(databaseName: string): Promise<void> {
        try {
            await this.client.deleteDatabase(databaseName)
        }
        catch (err: any) {
            let message = err.message
            if (err.response && err.response.data && err.response.data.message) {
                message = err.response.data.message
            }

            throw new Error(`${this.endpointUri}: Unable to delete database (${databaseName}): ${message}`);
        }
    }

    public async checkReplication(databaseName?: string) {
        try {
            return await this.client.checkReplication(databaseName);
        } catch (err: any) {
            const message = err.response ? err.response.data.message : err.message
            //console.log(`Replication checks failed on ${this.endpointUri}: ${message}`)
            this.storageEngine.emit('EndpointWarning',`Replication checks failed on ${this.endpointUri}: ${message}`)
        }
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

        const auth = await this.account!.getAuthContext(this.contextName, this.contextConfig, <VeridaDatabaseAuthTypeConfig>{
            endpointUri: this.endpointUri
        })

        return <VeridaDatabaseAuthContext> auth

        /*const client = new DatastoreServerClient(this.storageContext, this.contextConfig);
        await client.setAccount(this.account!);
    
        const auth = await client.getContextAuth();
        return auth*/
    }

    public async getUsage(retry: boolean): Promise<EndpointUsage> {
        return this.client.getUsage(retry)
    }

    public async getDatabases(retry: boolean) {
        return this.client.getDatabases(retry)
    }

    public async getDatabaseInfo(databaseName: string, retry: boolean) {
        return this.client.getDatabaseInfo(databaseName, retry)
    }

    public logout() {
        this.client = new DatastoreServerClient(
            this,
            this.contextName,
            this.endpointUri
        );
    }

}