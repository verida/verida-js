//import Axios from axios
import { EventEmitter } from 'events'
import Context from '../../../context'
import StorageEngineVerida from './engine'

export default class EndpointReplicator extends EventEmitter {

    public static async replicate(storageEngine: StorageEngineVerida, context: Context, endpoint: string): Promise<boolean> {
        // Authenticate with the new endpoint (will auto-create a user entry for the DID + context if they don't exist)
        

        // Pull the list of all databases from an existing storage node (storageNode.databases())
        // Iterate through each database calling PouchDb.replicate(source, destination) to replicate to the new node

        // As each database is successfully replicated, emit a progress event on the context object that returns the % of databases that have successfully replicated.
        context.emit('endpointReplicationProgress', )


        // Upon completion of replicating all the databases, the DID Document will be updated with the new endpoint.
        // Any existing open databases will be closed, so they are forced to re-open and include the new endpoint in the replication list.
        return true
    }

}