import { Context } from '../../../..';
import BaseNotification from '../../../notification'
import Axios, { AxiosInstance } from 'axios'
import { MessageSendConfig } from '../../../interfaces';

export default class NotificationEngineVerida implements BaseNotification {

    protected context: Context
    protected serverUrl: string
    protected did?: string

    protected errors: string[] = []

    constructor(context: Context, serverUrl: string[]) {
        this.context = context
        
        // For now, just use the first server
        this.serverUrl = <string> (serverUrl[0].endsWith("/") ? serverUrl : serverUrl + "/")
    }
    
    public async init(): Promise<void> {
        // Do nothing. No initialisation is required for this implementation.
        return
    }

    /**
    * Ping a notification server to fetch new messages
    */
    public async ping(recipientContextName: string, didToNotify: any): Promise<boolean> {
        const server = await this.getAxios();

        try {
            // Returns the client context and the corresponding `DID`
            await server.post(this.serverUrl + 'ping', {
                data: {
                    did: didToNotify,
                    context: recipientContextName
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

        if (!this.did) {
            const account = this.context.getAccount()

            if (!account) {
                throw new Error("Unable to locate account in Notification engine.")
            }
            
            this.did = await account.did()
        }

        // Authenticate using the DID and a signed consent message
        const keyring = await this.context.getAccount().keyring(contextName)
        const did = this.did!.toLowerCase()
        const message = `Access the notification service using context: "${contextName}"?\n\n${did}`
        const signature = await keyring.sign(message)

        config["auth"] = {
            username: did.replace(/:/g, "_"),
            password: signature,
        }

        return Axios.create(config)
    }

}