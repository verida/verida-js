import { IContext } from "@verida/types";
import BaseDb from "../context/engines/verida/database/base-db";
const _ = require("lodash");
import { EventEmitter } from 'events'

/**
 * 
 * Note: May need the ability to force override the DID if migrating data between testnet -> mainnet?
 * 
 * @param sourceContext 
 * @param destinationContext 
 */
export function migrateContext(sourceContext: IContext, destinationContext: IContext): EventEmitter {
    const eventManager = new EventEmitter()
    _migrateContext(sourceContext, destinationContext, eventManager)
    return eventManager
}

async function _migrateContext(sourceContext: IContext, destinationContext: IContext, eventManager: EventEmitter) {
    const sourceAccount = sourceContext.getAccount()
    const sourceDid = await sourceAccount.did()

    const sourceDbEngine = await sourceContext.getDatabaseEngine(sourceDid)
    const sourceDbInfo = await sourceDbEngine.info()
    const sourceDatabases = sourceDbInfo.databases

    eventManager.emit('start', sourceDatabases)

    for (let i in sourceDatabases) {
        const sourceDbInfo = sourceDatabases[i]

        // Don't migrate the special storage_database that is internally managed to maintain
        // a list of all the databases in a context
        if (sourceDbInfo.databaseName == 'storage_database') {
            continue
        }

        try {
            // Open source and destination databases
            const config = {
                permissions: sourceDbInfo.permissions,
                verifyEncryptionKey: false
            }

            const sourceDb = await sourceContext.openDatabase(sourceDbInfo.databaseName, config)
            const destinationDb = await destinationContext.openDatabase(sourceDbInfo.databaseName, config)

            // Migrate data
            await migrateDatabase(sourceDb, destinationDb)

            // Close databases
            await sourceDb.close()
            await destinationDb.close()

            // Emit success event
            eventManager.emit('migrated', sourceDbInfo, i, sourceDatabases.length)
        } catch (err: any) {
            eventManager.emit('error', err.message)
            return
        }
    }

    eventManager.emit('complete')
}

export async function migrateDatabase(sourceDb: BaseDb, destinationDb: BaseDb): Promise<void> {
    let sourceCouchDb, destinationCouchDb

    // Sync the remote databases, which is different depending on the type of database
    if (sourceDb.getRemoteEncrypted) {
        sourceCouchDb = await sourceDb.getRemoteEncrypted()
        destinationCouchDb = await destinationDb.getRemoteEncrypted()
    } else {
        sourceCouchDb = await sourceDb.getDb()
        destinationCouchDb = await destinationDb.getDb()
    }

    // Don't catch replication errors, allow them to bubble up
    await sourceCouchDb.replicate.to(destinationCouchDb)
}