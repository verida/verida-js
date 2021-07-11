import { AccountInterface } from '@verida/account'
import { Interfaces } from '@verida/storage-link'

import BaseStorageEngine from './engines/base'
import ExternalContext from './external'

/**
 * Storage for an authenticated user
 */
export default class AccountContext extends ExternalContext {

    public account: AccountInterface

    constructor(storageConfig: Interfaces.SecureStorageContextConfig, account: AccountInterface) {
        super(storageConfig)
        this.account = account
    }

    public async getStorage(): Promise<BaseStorageEngine> {
        const engine = await super.getStorage()
        engine.connectAccount(this.account)
        return engine
    }

    /*public async getMessaging(): Promise<BaseStorageEngine> {
        const engine = await super.getMessageEngine()
        engine.connectAccount(this.account)
        return engine
    }*/

}