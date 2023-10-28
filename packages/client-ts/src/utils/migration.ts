import { IContext } from "@verida/types";
import BaseDb from "../context/engines/verida/database/base-db";

export class MigrateContextError extends Error {}

export async function migrateContext(sourceContext: IContext, destinationContext: IContext) {
    const sourceAccount = sourceContext.getAccount()
    const sourceDid = await sourceAccount.did()

    const sourceDbEngine = await sourceContext.getDatabaseEngine(sourceDid)
    const sourceDbInfo = await sourceDbEngine.info()
    const sourceDatabases = sourceDbInfo.databases

    console.log('located databases: ', sourceDatabases)
    for (let i in sourceDatabases) {
        const sourceDbInfo = sourceDatabases[i]

        // open source and destination databases
        const sourceDb = await sourceContext.openDatabase(sourceDbInfo.databaseName, sourceDbInfo.permissions)
        const destinationDb = await sourceContext.openDatabase(sourceDbInfo.databaseName, sourceDbInfo.permissions)
        // show info on how much data is being migrated
        const rows = await sourceDb.getMany()
        console.log(`Migrating ${rows.length} rows for source database (${sourceDbInfo.databaseName})`)

        try {
            await migrateDatabase(sourceDb, destinationDb)
            console.log('closing...')
            await sourceDb.close()
            await destinationDb.close()
            console.log('migrated!')
        } catch (err: any) {
            throw new MigrateContextError(err.message)
        }
    }
}

export async function migrateDatabase(sourceDb: BaseDb, destinationDb: BaseDb): Promise<void> {
    let sourceCouchDb, destinationCouchDb

    if (sourceDb.getRemoteEncrypted) {
        console.log('have encrypted database, so replicated encrypted')
        sourceCouchDb = await sourceDb.getRemoteEncrypted()
        destinationCouchDb = await destinationDb.getRemoteEncrypted()
    } else {
        console.log('have non-necrypted database, so replicated normal')
        sourceCouchDb = await sourceDb.getDb()
        destinationCouchDb = await destinationDb.getDb()
    }

    try {
        const result = await sourceCouchDb.replicate.to(destinationCouchDb)
        console.log(result)
    } catch (err: any) {
        console.log('replication error')
        console.log(err)
    }

    const destinationRows = await destinationCouchDb.allDocs({
        include_docs: true
    })

    console.log('destination rows')
    console.log(destinationRows)

    const destinationRowsLocal = await destinationDb.getMany()

    console.log('destination rows local')
    console.log(destinationRowsLocal)
}