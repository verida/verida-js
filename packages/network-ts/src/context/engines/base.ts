import { AccountInterface } from '@verida/account'
import { Keyring } from '@verida/keyring'
import { Database, DatabaseOpenConfig, DatastoreOpenConfig } from './interfaces'

export default class BaseStorageEngine {

    protected storageContext: string
    protected endpointUri: string

    protected account?: AccountInterface
    protected keyring?: Keyring

    constructor(storageContext: string, endpointUri: string) {
        this.storageContext = storageContext
        this.endpointUri = endpointUri
    }

    public async connectAccount(account: AccountInterface) {
        this.account = account
        this.keyring = await account.keyring(this.storageContext)
    }

    public async openDatabase(databaseName: string, config: DatabaseOpenConfig): Promise<Database> {
        throw new Error('Not implemented')
    }

    /*public async openDatastore(schemaName: string, config: DatastoreOpenConfig) {
        throw new Error('Not implemented')
    }*/

    public logout() {
        this.account = undefined
        this.keyring = undefined
    }

}