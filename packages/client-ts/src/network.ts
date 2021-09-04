import Client from "./client"
import Context from "./context/context"
import { NetworkConnectionConfig } from "./interfaces"

export default class Network {

    public static async connect(config: NetworkConnectionConfig): Promise<Context | undefined> {
        const client = new Client(config.client)
        await client.connect(config.account)
        return client.openContext(config.context.name, config.context.forceCreate)
    }

}