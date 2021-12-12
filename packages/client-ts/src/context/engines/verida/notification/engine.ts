import { Context } from '../../../..';
import BaseNotification from '../../../notification'
import Axios, { AxiosInstance } from 'axios'

export default class NotificationEngineVerida implements BaseNotification {

    protected context: Context
    protected serverUrl: string
    protected did?: string

    protected errors: string[] = []

    constructor(context: Context, serverUrl: string) {
        this.context = context
        this.serverUrl = serverUrl
    }

    /**
     * Initialize notifications for the connected user
     *
     * (ie; connect to a notification server)
     */
    public async init(): Promise<void> {
        this.did = (await this.context.getAccount().did()).toLowerCase()
     }

     /**
      * Ping a notification server to fetch new messages
      */
    public async ping(): Promise<boolean> {
        await this.init()
        const server = await this.getAxios()

        try {
            await server.post(this.serverUrl + 'ping', {
                data: {
                    did: this.did!
                }
            })
        } catch (err: any) {
            this.errors.push(err.message)
            return false
        }

        return true
     }

    public getErrors(): string[] {
        return this.errors
    }

    protected async getAxios(): Promise<AxiosInstance> {
        const contextName = this.context.getContextName()
        const config: any = {
            headers: {
                "context-name": contextName,
            },
        }

        // Authenticate using the DID and a signed consent message
        const keyring = await this.context.getAccount().keyring(contextName)
        const signature = await keyring.sign(`Access the notification service using context: "${contextName}"?\n\n${this.did!}`)

        config["auth"] = {
            username: this.did!.replace(/:/g, "_"),
            password: signature,
        }

        return Axios.create(config)
    }

}