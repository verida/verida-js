import BaseNotification from '../../../notification'
import Axios, { AxiosInstance } from 'axios'
import { Keyring } from '@verida/keyring';

export default class NotificationEngineVerida implements BaseNotification {

    protected senderContextName: string
    protected senderKeyring: Keyring
    protected recipientContextName: string
    protected serverUrl: string
    protected did: string

    protected errors: string[] = []

    constructor(senderContextName: string, senderKeyring: Keyring, recipientContextName: string, did: string, serverUrls: string[]) {
        this.senderContextName = senderContextName
        this.senderKeyring = senderKeyring
        this.recipientContextName = recipientContextName
        this.did = did
        
        // For now, just use the first server
        this.serverUrl = <string> (serverUrls[0].endsWith("/") ? serverUrls[0] : serverUrls[0] + "/")
    }
    
    public async init(): Promise<void> {
        // Do nothing. No initialisation is required for this implementation.
        return
    }

    /**
    * Ping a notification server to fetch new messages
    */
    public async ping(): Promise<boolean> {
        const server = await this.getAxios();

        try {
            // Returns the client context and the corresponding `DID`
            this.serverUrl = 'http://192.168.68.124:5011/'
            await server.post(this.serverUrl + 'ping', {
                data: {
                    did: this.did,
                    context: this.recipientContextName
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
        const config: any = {
            headers: {
                "context-name": this.senderContextName,
            },
        }

        // Authenticate using the DID and a signed consent message
        const did = this.did!.toLowerCase()
        const message = `Access the notification service using context: "${this.senderContextName}"?\n\n${did}`
        const signature = await this.senderKeyring.sign(message)

        config["auth"] = {
            username: did.replace(/:/g, "_"),
            password: signature,
        }

        return Axios.create(config)
    }

}