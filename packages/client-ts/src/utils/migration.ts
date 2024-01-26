import { IContext, IDatabase } from "@verida/types";
const _ = require("lodash");
import { EventEmitter } from 'events'
import EncryptedDatabase from "../context/engines/verida/database/db-encrypted";

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
    const sourceDbInfo: any = await sourceDbEngine.info()
    const sourceDatabases = sourceDbInfo.databases

    eventManager.emit('start', sourceDatabases)

    for (let i in sourceDatabases) {
        const sourceDbInfo = sourceDatabases[i]

        // Don't migrate the special storage_database that is internally managed to maintain
        // a list of all the databases in a context
        if (sourceDbInfo.databaseName == 'storage_database') {
            eventManager.emit('migrated', sourceDbInfo, parseInt(i) + 1, sourceDatabases.length)
            continue
        }

        try {
            // Open source and destination databases

            const sourceConfig = {
                permissions: sourceDbInfo.permissions,
                verifyEncryptionKey: false
            }
            const sourceDb = await sourceContext.openDatabase(sourceDbInfo.databaseName, sourceConfig)

            const destinationConfig = {
                permissions: sourceDbInfo.permissions,
                verifyEncryptionKey: false
            }
            const destinationDb = await destinationContext.openDatabase(sourceDbInfo.databaseName, destinationConfig)

            // Migrate data
            await migrateDatabase(sourceDb, destinationDb)

            // Close databases
            await sourceDb.close()
            await destinationDb.close()

            // Emit success event
            eventManager.emit('migrated', sourceDbInfo, parseInt(i) + 1, sourceDatabases.length)
        } catch (err: any) {
            eventManager.emit('error', err.message)
            return
        }
    }

    eventManager.emit('complete')
}

export async function migrateDatabase(sourceDb: IDatabase, destinationDb: IDatabase): Promise<void> {
    // Loop through all records in the source database and save them to the destination database
    // We do this to ensure the data is re-encrypted using the correct key of the destination database
    // If we used pouchdb in-built replication, the data would be migrated to a database with an incorrect
    // encryption key

    const limit = 1
    let skip = 0
    while (true) {
        const records = await sourceDb.getMany({}, {
            limit,
            skip
        })

        for (let r in records) {
            const record: any = records[r]

            // Delete revision info so the record saves correctly
            delete record['_rev']
            try {
                await destinationDb.save(records[r])
            } catch (err: any) {
                if (err.status != 409) {
                    throw err
                }
            }
        }

        if (records.length == 0 || records.length < limit) {
            // All data migrated
            break
        }

        skip += limit
    }
}
