import { Account } from '@verida/account'
import { Keyring } from '@verida/keyring'
import { DatabaseOpenConfig, DatastoreOpenConfig } from '../interfaces'
import Database from '../database'
import Datastore from '../datastore'


export default class BaseStorageEngine {

    protected storageContext: string
    protected endpointUri: string

    protected account?: Account
    protected keyring?: Keyring

    constructor(storageContext: string, endpointUri: string) {
        this.storageContext = storageContext
        this.endpointUri = endpointUri
    }

    public async connectAccount(account: Account) {
        this.account = account
        this.keyring = await account.keyring(this.storageContext)
    }

    public async openDatabase(databaseName: string, config: DatabaseOpenConfig): Promise<Database> {
        throw new Error('Not implemented')
    }

    public async openDatastore(schemaName: string, config: DatastoreOpenConfig): Promise<Datastore> {
        throw new Error('Not implemented')
    }

    public logout() {
        this.account = undefined
        this.keyring = undefined
    }

}