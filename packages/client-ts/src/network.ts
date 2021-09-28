import Client from "./client"
import Context from "./context/context"
import { NetworkConnectionConfig } from "./interfaces"

export default class Network {

    /**
     * Opens a new application context to provide encrypted storage and messaging to an application.
     * 
     * This is a quicker alternative to generating a `client` connection to the Verida network
     * and then opening a context.
     * 
     * @param config NetworkConnectionConfig Configuration 
     * @returns 
     */
    public static async connect(config: NetworkConnectionConfig): Promise<Context | undefined> {
        const client = new Client(config.client ? config.client : {})
        await client.connect(config.account)
        return client.openContext(config.context.name, config.context.forceCreate)
    }

}